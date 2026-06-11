const { z } = require("zod");
const Product = require("../models/Product");

const PRODUCT_CATEGORIES = [
  "Subscriptions",
  "Combo Pack",
  "Software",
  "Music",
  "Adult",
];

const planInputSchema = z.object({
  months: z.coerce.number().int("Months must be an integer").min(1).max(120),
  price: z.coerce.number().min(0).max(10_000_000),
  realPrice: z.coerce.number().min(0).max(10_000_000).optional().default(0),
});

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(200),
  service_id: z.coerce
    .number()
    .int("Service ID must be a whole number")
    .min(1000, "Service ID must be a 4-digit number")
    .max(9999, "Service ID must be a 4-digit number")
    .optional(),
  category: z.enum(PRODUCT_CATEGORIES, {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),
  description: z.string().trim().min(1, "Description is required").max(2000),
  image: z
    .string()
    .trim()
    .min(1, "Image is required")
    .max(2000)
    .refine(
      (v) => /^https?:\/\//i.test(v) || /^\/uploads\/[A-Za-z0-9._-]+$/.test(v),
      "Image must be an uploaded file or a valid URL"
    ),
  plans: z
    .array(planInputSchema)
    .min(1, "At least one plan is required")
    .max(12, "Too many plans"),
});

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const serialize = (p) => ({
  id: p._id.toString(),
  service_id: p.service_id,
  name: p.name,
  category: p.category,
  description: p.description,
  image: p.image,
  plans: (p.plans || []).map((pl) => ({ months: pl.months, price: pl.price, realPrice: pl.realPrice || 0 })),
  createdAt: p.createdAt,
});

// Pick a unique 4-digit service_id with a few random attempts.
async function generateUniqueServiceId() {
  for (let i = 0; i < 12; i++) {
    const candidate = Math.floor(1000 + Math.random() * 9000);
    const exists = await Product.exists({ service_id: candidate });
    if (!exists) return candidate;
  }
  // Fallback: scan for the next free id.
  const used = await Product.find({}, { service_id: 1 }).lean();
  const taken = new Set(used.map((u) => u.service_id));
  for (let n = 1000; n <= 9999; n++) {
    if (!taken.has(n)) return n;
  }
  throw new Error("No service IDs available");
}

// Public — list products (newest first). Supports ?category=Subscriptions
exports.list = async (req, res) => {
  try {
    const filter = {};
    const category = String(req.query.category || "").trim();
    if (category) {
      if (!PRODUCT_CATEGORIES.includes(category)) {
        return fail(res, 400, "Invalid category");
      }
      filter.category = category;
    }
    const products = await Product.find(filter)
      .sort({ service_id: 1, createdAt: -1 })
      .lean();
    return res.json({ success: true, products: products.map(serialize) });
  } catch (err) {
    console.error("[products/list]", err);
    return fail(res, 500, "Server error");
  }
};

// Public — single product by id.
exports.getOne = async (req, res) => {
  const id = String(req.params.id || "").trim();
  try {
    let product = null;
    if (/^\d{4}$/.test(id)) {
      product = await Product.findOne({ service_id: Number(id) }).lean();
    } else if (/^[a-f0-9]{24}$/i.test(id)) {
      product = await Product.findById(id).lean();
    } else {
      return fail(res, 400, "Invalid product id");
    }
    if (!product) return fail(res, 404, "Product not found");
    return res.json({ success: true, product: serialize(product) });
  } catch (err) {
    console.error("[products/getOne]", err);
    return fail(res, 500, "Server error");
  }
};

// Admin only — create.
exports.create = async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, parsed.error.issues[0]?.message || "Invalid input");

  // Deduplicate plans by months — keep the last occurrence.
  const seen = new Map();
  for (const plan of parsed.data.plans) seen.set(plan.months, plan);
  const plans = Array.from(seen.values()).sort((a, b) => a.months - b.months);

  try {
    let service_id = parsed.data.service_id;
    if (service_id) {
      const dupe = await Product.exists({ service_id });
      if (dupe) return fail(res, 409, "Service ID already in use");
    } else {
      service_id = await generateUniqueServiceId();
    }
    const product = await Product.create({
      ...parsed.data,
      service_id,
      plans,
    });
    return res.status(201).json({ success: true, product: product.toSafeJSON() });
  } catch (err) {
    if (err && err.code === 11000) {
      return fail(res, 409, "Service ID already in use");
    }
    console.error("[products/create]", err);
    return fail(res, 500, "Server error");
  }
};

// Admin only — delete by id.
exports.remove = async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!/^[a-f0-9]{24}$/i.test(id)) return fail(res, 400, "Invalid product id");
  try {
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) return fail(res, 404, "Product not found");
    return res.json({ success: true, id });
  } catch (err) {
    console.error("[products/remove]", err);
    return fail(res, 500, "Server error");
  }
};
