const express = require("express");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const requireAuth = require("../middleware/auth");
const Cart = require("../models/Cart");

const router = express.Router();

// Generous limits — typical sessions issue 1 sync per few seconds. Hard cap
// protects against a runaway client.
const cartReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, slow down." },
});
const cartWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many cart updates, slow down." },
});

const itemSchema = z.object({
  productId: z.string().min(1).max(64),
  months: z.coerce.number().int().min(1).max(120),
  quantity: z.coerce.number().int().min(1).max(99),
  name: z.string().max(200).optional().default(""),
  image: z.string().max(1024).optional().default(""),
  category: z.string().max(80).optional().default(""),
  price: z.coerce.number().min(0).max(10_000_000),
  realPrice: z.coerce.number().min(0).max(10_000_000).optional().default(0),
});

const replaceSchema = z.object({
  items: z.array(itemSchema).max(50),
});

function toClient(cart) {
  return (cart?.items || []).map((it) => ({
    productId: it.productId,
    months: it.months,
    quantity: it.quantity,
    name: it.name || "",
    image: it.image || "",
    category: it.category || "",
    price: it.price,
    realPrice: it.realPrice || 0,
  }));
}

// Dedupe by (productId, months) — last write wins, quantities NOT summed
// here because client already merges before sending.
function dedupe(items) {
  const map = new Map();
  for (const it of items) {
    const key = `${it.productId}::${it.months}`;
    map.set(key, it);
  }
  return Array.from(map.values());
}

router.get("/", requireAuth, cartReadLimiter, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).lean();
    res.json({ success: true, items: toClient(cart) });
  } catch (e) {
    next(e);
  }
});

// Replace the entire cart atomically. Frontend debounces and sends the full
// canonical list — simpler and conflict-free vs per-item endpoints.
router.put("/", requireAuth, cartWriteLimiter, async (req, res, next) => {
  try {
    const parsed = replaceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid cart payload" });
    }
    const items = dedupe(parsed.data.items);
    const cart = await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { items } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ success: true, items: toClient(cart) });
  } catch (e) {
    next(e);
  }
});

router.delete("/", requireAuth, cartWriteLimiter, async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { items: [] } },
      { upsert: true }
    );
    res.json({ success: true, items: [] });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
