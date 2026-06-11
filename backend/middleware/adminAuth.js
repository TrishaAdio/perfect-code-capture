const { verifyToken } = require("../config/jwt");
const Admin = require("../models/Admin");

// Verifies JWT and ensures the token was issued for an admin (role === "admin")
// AND that its `tv` claim matches the admin's current tokenVersion. Bumping
// tokenVersion (logout / forced revoke) immediately invalidates every
// outstanding session.
module.exports = async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Admin authentication required" });
  try {
    const decoded = verifyToken(token);
    if (decoded.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access only" });
    }
    // Cheap session-revocation check. tv missing on legacy tokens → treat as 0.
    const admin = await Admin.findById(decoded.sub).select("tokenVersion");
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired admin token" });
    }
    const currentTv = Number(admin.tokenVersion || 0);
    const tokenTv = Number(decoded.tv || 0);
    if (currentTv !== tokenTv) {
      return res
        .status(401)
        .json({ success: false, message: "Session revoked. Please sign in again." });
    }
    req.admin = decoded;
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired admin token" });
  }
};
