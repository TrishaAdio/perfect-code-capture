const { verifyToken } = require("../config/jwt");

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};
