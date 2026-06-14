const express = require("express");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const requireAuth = require("../middleware/auth");
const Order = require("../models/Order");
const Invoice = require("../models/Invoice");
const User = require("../models/User");
const { upstreamFetch } = require("../utils/upstreamFetch");
const log = require("../utils/logger");

const router = express.Router();

const ORDER_API = (process.env.ORDER_API_URL || "http://13.250.53.39:4002").replace(/\/+$/, "");
const ORDER_API_KEY = process.env.ORDER_API_KEY || "";
const orderApiHeaders = (extra = {}) =>
  ORDER_API_KEY ? { "X-API-Key": ORDER_API_KEY, ...extra } : { ...extra };

const orderCreateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many orders, please slow down." },
});
const orderVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, slow down." },
});

// Strict, server-authoritative input. We accept ONLY the invoice id — every
// price/product field is derived server-side from the persisted Invoice doc.
// (Old fields like value/realPrice/productName/productImage are accepted but
// ignored, so the existing frontend payload keeps working without break.)
const createOrderSchema = z.object({
  invoiceId: z.string().regex(/^[A-Za-z0-9_-]{4,64}$/, "Invalid invoice id"),
});

router.post("/", requireAuth, orderCreateLimiter, async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ success: false, message: parsed.error.issues[0]?.message || "Invalid order" });
  }
  const { invoiceId } = parsed.data;

  try {
    // 1) Locate the invoice + verify ownership.
    const invoice = await Invoice.findOne({ invoiceId });
    if (!invoice) {
      log.warn("order_unknown_invoice", { userId, invoiceId });
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    if (invoice.userId.toString() !== userId) {
      log.warn("order_invoice_owner_mismatch", { userId, invoiceId, owner: invoice.userId.toString() });
      // Generic — never confirm whether an invoice id exists for someone else.
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // 2) Reject reuse — atomically claim the invoice.
    if (invoice.used) {
      const existing = await Order.findOne({ invoiceId, userId }).lean();
      if (existing) {
        return res.json({
          success: true,
          order: serializeOrder(existing),
          duplicate: true,
        });
      }
      return res.status(409).json({ success: false, message: "Invoice already used" });
    }

    // 3) Re-confirm payment status with upstream — never trust local cache alone
    //    if status isn't PAID yet.
    if (invoice.status !== "PAID") {
      try {
        const upstream = await upstreamFetch(
          `${process.env.PAY_API_URL || "http://13.250.53.39:4001"}/check/${encodeURIComponent(invoiceId)}?t=${Date.now()}`,
          { headers: { "Cache-Control": "no-cache" } }
        );
        const text = await upstream.text();
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          /* ignore */
        }
        const isPaid =
          data &&
          (data.paid === true || data.paid === "true" || Boolean(data.utr));
        if (!isPaid) {
          return res.status(402).json({
            success: false,
            message: "Payment has not been confirmed yet",
          });
        }
        // Optional amount sanity check from upstream.
        if (data.amount != null) {
          const upstreamAmt = Number(data.amount);
          if (
            Number.isFinite(upstreamAmt) &&
            Math.abs(upstreamAmt - invoice.expectedAmount) > 1
          ) {
            log.warn("order_amount_mismatch", {
              invoiceId,
              expected: invoice.expectedAmount,
              upstream: upstreamAmt,
            });
            return res.status(409).json({
              success: false,
              message: "Payment amount mismatch — please contact support",
            });
          }
        }
        invoice.status = "PAID";
        invoice.paidAt = new Date();
        invoice.upstreamUtr = String(data.utr || "").slice(0, 100);
      } catch (err) {
        log.warn("order_payment_recheck_failed", { reason: err.message });
        return res.status(502).json({
          success: false,
          message: "Payment service temporarily unavailable",
        });
      }
    }

    // 4) Atomically mark used → prevents race-condition double-spend.
    const claimed = await Invoice.findOneAndUpdate(
      { invoiceId, used: false },
      { $set: { used: true, status: "PAID" } },
      { new: true }
    );
    if (!claimed) {
      const existing = await Order.findOne({ invoiceId, userId }).lean();
      if (existing) {
        return res.json({ success: true, order: serializeOrder(existing), duplicate: true });
      }
      return res.status(409).json({ success: false, message: "Invoice already used" });
    }

    // 5) Now (and only now) call the upstream order-creation API. Promo code
    //    is derived server-side; productName/value come from the invoice.
    const promoCode = `SYMDEALS${String(invoiceId).replace(/\D/g, "").slice(-4) || "0000"}`;
    const userDoc = await User.findById(userId).select("email").lean();
    const userEmail = (userDoc && userDoc.email) || req.user?.email || "noemail@symdeals.local";
    const url = `${ORDER_API}/create=${encodeURIComponent(claimed.productNameSnapshot)}=${encodeURIComponent(
      promoCode
    )}=${encodeURIComponent(claimed.expectedAmount)}=${encodeURIComponent(userEmail)}`;

    let upstream;
    try {
      upstream = await upstreamFetch(url, { method: "GET", headers: orderApiHeaders() });
    } catch (err) {
      // Roll the invoice back so user can retry without losing the slot.
      await Invoice.updateOne({ invoiceId }, { $set: { used: false } });
      log.error("order_upstream_failed", { reason: err.message, invoiceId });
      return res.status(502).json({ success: false, message: "Order service temporarily unavailable" });
    }

    let data = null;
    try {
      data = await upstream.json();
    } catch {
      /* ignore */
    }
    if (!upstream.ok || !data || !data.order_id) {
      await Invoice.updateOne({ invoiceId }, { $set: { used: false } });
      log.warn("order_upstream_bad_response", { status: upstream.status, invoiceId });
      return res.status(502).json({ success: false, message: "Order could not be placed — please retry" });
    }

    const savings =
      claimed.realPrice > claimed.expectedAmount
        ? Math.round(claimed.realPrice - claimed.expectedAmount)
        : 0;

    const order = await Order.create({
      userId,
      orderId: String(data.order_id),
      productName: claimed.productNameSnapshot,
      productImage: claimed.productImageSnapshot,
      amount: claimed.expectedAmount,
      realPrice: claimed.realPrice,
      savings,
      status: (data.status || "PROCESSING").toUpperCase(),
      invoiceId,
      promoCode,
    });

    log.info("order_created", {
      userId,
      orderId: order.orderId,
      invoiceId,
      amount: claimed.expectedAmount,
    });

    return res.json({ success: true, order: order.toSafeJSON() });
  } catch (err) {
    log.error("order_create_error", { reason: err.message });
    return res.status(500).json({ success: false, message: "Failed to create order" });
  }
});

function serializeOrder(o) {
  return {
    id: o._id.toString(),
    orderId: o.orderId,
    productName: o.productName,
    productImage: o.productImage,
    amount: o.amount,
    realPrice: o.realPrice || 0,
    savings: o.savings || 0,
    status: o.status,
    invoiceId: o.invoiceId,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required" });
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).limit(200);
    return res.json({ success: true, orders: orders.map((o) => o.toSafeJSON()) });
  } catch (err) {
    log.error("orders_list_error", { reason: err.message });
    return res.status(500).json({ success: false, message: "Failed to load orders" });
  }
});

router.get("/verify/:orderId", requireAuth, orderVerifyLimiter, async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required" });

    const { orderId } = req.params;
    if (!/^[A-Za-z0-9_-]{4,64}$/.test(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }

    const order = await Order.findOne({ orderId, userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status === "COMPLETED") {
      noStore(res);
      return res.json({ success: true, status: "COMPLETED" });
    }

    let upstreamStatus = order.status;
    try {
      const upstream = await upstreamFetch(
        `${ORDER_API}/verify=${encodeURIComponent(orderId)}?t=${Date.now()}`,
        { headers: orderApiHeaders({ "Cache-Control": "no-cache" }) }
      );
      const data = await upstream.json().catch(() => null);
      if (data && data.status) {
        upstreamStatus = String(data.status).toUpperCase();
      }
    } catch (err) {
      log.warn("orders_verify_upstream_failed", { reason: err.message });
    }

    if (upstreamStatus !== order.status) {
      order.status = upstreamStatus;
      await order.save();
    }
    noStore(res);
    return res.json({ success: true, status: order.status });
  } catch (err) {
    log.error("orders_verify_error", { reason: err.message });
    return res.status(500).json({ success: false, message: "Failed to verify order" });
  }
});

function noStore(res) {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
}

module.exports = router;
