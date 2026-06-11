const { z } = require("zod");
const Notice = require("../models/Notice");

const NOTICE_TYPES = ["info", "success", "warning", "urgent"];

const dateInput = z
  .union([z.string().min(1), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === null || v === "") return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  });

const createSchema = z.object({
  title: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(1, "Message is required").max(500),
  type: z.enum(NOTICE_TYPES).default("info"),
  active: z.boolean().optional().default(true),
  startsAt: dateInput,
  expiresAt: dateInput,
});

const updateSchema = z.object({
  title: z.string().trim().max(120).optional(),
  message: z.string().trim().min(1).max(500).optional(),
  type: z.enum(NOTICE_TYPES).optional(),
  active: z.boolean().optional(),
  startsAt: dateInput,
  expiresAt: dateInput,
});

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

const serialize = (n) => ({
  id: n._id.toString(),
  title: n.title || "",
  message: n.message,
  type: n.type,
  active: !!n.active,
  startsAt: n.startsAt ? new Date(n.startsAt).toISOString() : null,
  expiresAt: n.expiresAt ? new Date(n.expiresAt).toISOString() : null,
  createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : null,
  updatedAt: n.updatedAt ? new Date(n.updatedAt).toISOString() : null,
});

// Public — currently active notices.
exports.listActive = async (_req, res) => {
  try {
    const now = new Date();
    const notices = await Notice.find({
      active: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      ],
    })
      .sort({ updatedAt: -1 })
      .lean();
    return res.json({ success: true, notices: notices.map(serialize) });
  } catch (err) {
    console.error("[notices/listActive]", err);
    return fail(res, 500, "Server error");
  }
};

// Admin — list all.
exports.listAll = async (_req, res) => {
  try {
    const notices = await Notice.find({}).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, notices: notices.map(serialize) });
  } catch (err) {
    console.error("[notices/listAll]", err);
    return fail(res, 500, "Server error");
  }
};

exports.create = async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, parsed.error.issues[0]?.message || "Invalid input");
  try {
    const notice = await Notice.create(parsed.data);
    return res.status(201).json({ success: true, notice: notice.toSafeJSON() });
  } catch (err) {
    console.error("[notices/create]", err);
    return fail(res, 500, "Server error");
  }
};

exports.update = async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!/^[a-f0-9]{24}$/i.test(id)) return fail(res, 400, "Invalid id");
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, parsed.error.issues[0]?.message || "Invalid input");
  try {
    const notice = await Notice.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    });
    if (!notice) return fail(res, 404, "Notice not found");
    return res.json({ success: true, notice: notice.toSafeJSON() });
  } catch (err) {
    console.error("[notices/update]", err);
    return fail(res, 500, "Server error");
  }
};

exports.remove = async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!/^[a-f0-9]{24}$/i.test(id)) return fail(res, 400, "Invalid id");
  try {
    const deleted = await Notice.findByIdAndDelete(id);
    if (!deleted) return fail(res, 404, "Notice not found");
    return res.json({ success: true, id });
  } catch (err) {
    console.error("[notices/remove]", err);
    return fail(res, 500, "Server error");
  }
};
