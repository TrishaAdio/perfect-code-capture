const { z } = require("zod");
const Admin = require("../models/Admin");
const User = require("../models/User");
const { signToken } = require("../config/jwt");
const { upstreamFetch } = require("../utils/upstreamFetch");

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email").max(255),
  password: z.string().min(1, "Password is required").max(128),
});

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

exports.login = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, parsed.error.issues[0]?.message || "Invalid input");

  const { email, password } = parsed.data;
  try {
    const admin = await Admin.findOne({ email }).select("+password +tokenVersion");
    if (!admin) return fail(res, 401, "Invalid email or password");
    const ok = await admin.comparePassword(password);
    if (!ok) return fail(res, 401, "Invalid email or password");

    const token = signToken({
      sub: admin._id.toString(),
      email: admin.email,
      role: "admin",
      tv: admin.tokenVersion || 0,
    });

    // Defence-in-depth: also set the token in an HttpOnly cookie so an XSS
    // exfil of localStorage isn't enough to hijack the admin session. The
    // frontend keeps using the Authorization header (UX unchanged); the
    // cookie is purely a future-proof secondary channel.
    const isProd = process.env.NODE_ENV === "production";
    res.cookie?.("symdeals_admin", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: isProd,
      maxAge: 2 * 24 * 60 * 60 * 1000, // 2d
      path: "/api/admin",
    });

    return res.json({ success: true, token, admin: admin.toSafeJSON() });
  } catch (err) {
    console.error("[admin/login]", err);
    return fail(res, 500, "Server error");
  }
};

// Bump tokenVersion → all outstanding admin JWTs are immediately invalidated.
exports.logout = async (req, res) => {
  try {
    const adminId = req.admin?.sub;
    if (adminId) {
      await Admin.updateOne(
        { _id: adminId },
        { $inc: { tokenVersion: 1 } }
      );
    }
    res.clearCookie?.("symdeals_admin", { path: "/api/admin" });
    return res.json({ success: true });
  } catch (err) {
    console.error("[admin/logout]", err);
    return fail(res, 500, "Server error");
  }
};

exports.statsToday = async (_req, res) => {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const [users, monthUsers, totalUsers] = await Promise.all([
      User.find({ createdAt: { $gte: start, $lte: end } })
        .select("name email createdAt")
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      User.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
      User.countDocuments({}),
    ]);

    return res.json({
      success: true,
      todayUsers: users.length,
      monthUsers,
      totalUsers,
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    console.error("[admin/stats/today]", err);
    return fail(res, 500, "Server error");
  }
};

exports.statsWeekly = async (req, res) => {
  try {
    const rangeParam = String(req.query.range || "7d").toLowerCase();
    const days = rangeParam === "30d" ? 30 : 7;

    const now = new Date();
    const buckets = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      buckets.push({ start: d, end: next });
    }

    const windowStart = buckets[0].start;
    const windowEnd = buckets[buckets.length - 1].end;

    const rows = await User.find({
      createdAt: { $gte: windowStart, $lt: windowEnd },
    })
      .select("createdAt")
      .lean();

    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const fullNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const monthLabels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const data = buckets.map(({ start, end }) => {
      const count = rows.filter((r) => {
        const t = new Date(r.createdAt).getTime();
        return t >= start.getTime() && t < end.getTime();
      }).length;
      return {
        day: dayLabels[start.getDay()],
        dayFull: fullNames[start.getDay()],
        label:
          days === 30
            ? `${monthLabels[start.getMonth()]} ${start.getDate()}`
            : dayLabels[start.getDay()],
        date: start.toISOString().slice(0, 10),
        count,
      };
    });

    return res.json({ success: true, range: days === 30 ? "30d" : "7d", data });
  } catch (err) {
    console.error("[admin/stats/weekly]", err);
    return fail(res, 500, "Server error");
  }
};

exports.allUserEmails = async (_req, res) => {
  try {
    const users = await User.find({})
      .select("email name")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      success: true,
      total: users.length,
      users: users.map((u) => ({ email: u.email, name: u.name })),
    });
  } catch (err) {
    console.error("[admin/users/emails]", err);
    return fail(res, 500, "Server error");
  }
};

const EMAIL_API_URL =
  process.env.EMAIL_API_URL || "http://13.236.80.206:4000/sendemail";

const sendEmailSchema = z.object({
  to: z.string().trim().toLowerCase().email("Invalid recipient email").max(255),
  subject: z.string().trim().min(1, "Subject is required").max(300),
  html: z.string().min(1, "HTML body is required").max(200_000),
});

// Server-side proxy to the external email API. The external service does not
// expose CORS headers, so the browser cannot call it directly. Admin-only.
exports.sendEmail = async (req, res) => {
  const parsed = sendEmailSchema.safeParse(req.body);
  if (!parsed.success)
    return fail(res, 400, parsed.error.issues[0]?.message || "Invalid input");

  const { to, subject, html } = parsed.data;
  try {
    const upstream = await upstreamFetch(EMAIL_API_URL, {
      method: "POST",
      body: { to, subject, html },
    });
    let data = null;
    try {
      data = await upstream.json();
    } catch {
      /* ignore non-JSON body */
    }
    if (!upstream.ok) {
      const msg =
        (data && typeof data === "object" && data.message) ||
        `Upstream email API returned ${upstream.status}`;
      return fail(res, 502, String(msg));
    }
    return res.json({ success: true, to });
  } catch (err) {
    console.error("[admin/send-email]", err);
    return fail(res, 502, "Failed to reach email service");
  }
};

const ORDERS_API_URL = (process.env.ORDERS_API_URL || "http://13.250.53.39:4002").replace(/\/+$/, "");
const ORDERS_API_KEY = process.env.ORDERS_API_KEY || "";

// Proxy to external orders/earnings service. Admin-only. Browsers can't
// hit the upstream directly (no CORS, plaintext HTTP from HTTPS origin).
exports.earningsStats = async (_req, res) => {
  try {
    const upstream = await fetch(`${ORDERS_API_URL}/stats`, {
      method: "GET",
      headers: ORDERS_API_KEY ? { "X-API-Key": ORDERS_API_KEY } : {},
    });
    const text = await upstream.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* non-JSON */ }
    if (!upstream.ok) {
      return fail(res, 502, (data && data.message) || `Upstream stats returned ${upstream.status}`);
    }
    return res.json({ success: true, stats: data });
  } catch (err) {
    console.error("[admin/earnings]", err);
    return fail(res, 502, "Failed to reach orders service");
  }
};

exports.me = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.sub);
    if (!admin) return fail(res, 404, "Admin not found");
    return res.json({ success: true, admin: admin.toSafeJSON() });
  } catch (err) {
    console.error("[admin/me]", err);
    return fail(res, 500, "Server error");
  }
};
