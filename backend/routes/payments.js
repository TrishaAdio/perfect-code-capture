const express = require("express");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const requireAuth = require("../middleware/auth");
const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const { upstreamFetch } = require("../utils/upstreamFetch");
const log = require("../utils/logger");

const router = express.Router();

const PAY_API = process.env.PAY_API_URL || "http://13.250.53.39:4001";

// Aggressive — payments are expensive (per-call upstream cost + abuse risk).
const payCreateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 12, // 12 invoice generations / 10 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many payment requests, slow down." },
});
const payCheckLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, slow down." },
});

const createSchema = z.object({
  productId: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid product"),
  months: z.coerce.number().int().min(1).max(120),
  quantity: z.coerce.number().int().min(1).max(20).optional().default(1),
  // amount/merchant_name from old client are accepted for back-compat but
  // intentionally ignored — server computes the authoritative amount.
  amount: z.unknown().optional(),
  merchant_name: z.unknown().optional(),
});

// Authenticated. Generates a payment QR via upstream, then persists an
// Invoice doc that ties (invoiceId ↔ userId ↔ productId ↔ amount). The
// Invoice record is what /api/orders later trusts.
router.post("/create", requireAuth, payCreateLimiter, async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) return res.status(401).json({ success: false, message: "Authentication required" });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ success: false, message: parsed.error.issues[0]?.message || "Invalid request" });
  }
  const { productId, months, quantity } = parsed.data;

  try {
    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const plan = (product.plans || []).find((p) => Number(p.months) === Number(months));
    if (!plan) return res.status(400).json({ success: false, message: "Selected plan is no longer available" });

    const unitPrice = Math.round(Number(plan.price) || 0);
    if (unitPrice <= 0) return res.status(400).json({ success: false, message: "This plan cannot be purchased" });

    const totalAmount = unitPrice * quantity;
    const realPriceTotal =
      plan.realPrice && plan.realPrice > plan.price ? plan.realPrice * quantity : 0;

    const merchantName = `${product.name} ${months} month${months > 1 ? "s" : ""}`.slice(0, 80);

    let upstream;
    try {
      upstream = await upstreamFetch(`${PAY_API}/create`, {
        method: "POST",
        body: {
          amount: totalAmount,
          merchant_name: merchantName,
          merchant_desc: merchantName,
        },
      });
    } catch (err) {
      log.error("payments_create_upstream_failed", { reason: err.message, reqId: req.id });
      return res
        .status(502)
        .json({ success: false, message: "Payment service temporarily unavailable" });
    }

    const text = await upstream.text();
    let raw = null;
    try {
      raw = text ? JSON.parse(text) : null;
    } catch {
      /* ignore */
    }
    if (!upstream.ok || !raw) {
      log.warn("payments_create_bad_upstream", { status: upstream.status });
      return res
        .status(502)
        .json({ success: false, message: "Payment service temporarily unavailable" });
    }

    const invoiceId = raw.invoice_id || raw.tracking_id;
    if (!invoiceId || !raw.qr_base64) {
      return res
        .status(502)
        .json({ success: false, message: "Payment service returned an invalid response" });
    }
    const uniqueAmount = Number(raw.unique_amount ?? totalAmount);

    // Persist binding. Reject if invoice ID collision (extremely rare).
    try {
      await Invoice.create({
        invoiceId: String(invoiceId),
        userId,
        productId: product._id,
        months,
        quantity,
        expectedAmount: uniqueAmount,
        productPrice: totalAmount,
        realPrice: realPriceTotal,
        productNameSnapshot: merchantName,
        productImageSnapshot: String(product.image || "").slice(0, 2000),
        status: "PENDING",
        used: false,
      });
    } catch (err) {
      if (err && err.code === 11000) {
        log.warn("payments_create_invoice_collision", { invoiceId });
        return res
          .status(502)
          .json({ success: false, message: "Please retry your payment" });
      }
      throw err;
    }

    log.info("payment_invoice_created", {
      userId,
      invoiceId,
      amount: uniqueAmount,
      productId: product._id.toString(),
    });

    // Mirror upstream shape so frontend parsing is unchanged.
    return res.json({
      invoice_id: invoiceId,
      unique_amount: uniqueAmount,
      qr_base64: raw.qr_base64,
      upi_link: raw.upi_link || "",
      check_url: "", // intentionally hidden — frontend uses our /check proxy
    });
  } catch (err) {
    log.error("payments_create_error", { reason: err.message });
    return res
      .status(502)
      .json({ success: false, message: "Payment service temporarily unavailable" });
  }
});

// Check payment status. Public access OK — knowing an invoice was paid does
// not grant order creation (which requires the invoice owner's session).
// We still bump the local Invoice record to PAID when upstream confirms,
// so /orders can trust DB state.
router.get("/check/:invoiceId", payCheckLimiter, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    if (!/^[A-Za-z0-9_-]{4,64}$/.test(invoiceId)) {
      return res.status(400).json({ success: false, message: "Invalid invoice id" });
    }

    let upstream;
    try {
      upstream = await upstreamFetch(
        `${PAY_API}/check/${encodeURIComponent(invoiceId)}?t=${Date.now()}`,
        { headers: { "Cache-Control": "no-cache" } }
      );
    } catch (err) {
      log.warn("payments_check_upstream_failed", { reason: err.message });
      return res
        .status(502)
        .json({ success: false, message: "Payment service temporarily unavailable" });
    }

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

    // Mirror status into our Invoice record so /orders can verify quickly.
    if (isPaid) {
      try {
        await Invoice.updateOne(
          { invoiceId, status: { $ne: "PAID" } },
          {
            $set: {
              status: "PAID",
              paidAt: new Date(),
              upstreamUtr: String(data.utr || "").slice(0, 100),
            },
          }
        );
      } catch (err) {
        log.warn("payments_check_persist_failed", { reason: err.message });
      }
    }

    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    });
    return res
      .status(upstream.status)
      .type(upstream.headers.get("content-type") || "application/json")
      .send(text);
  } catch (err) {
    log.error("payments_check_error", { reason: err.message });
    return res
      .status(502)
      .json({ success: false, message: "Payment service temporarily unavailable" });
  }
});

module.exports = router;
