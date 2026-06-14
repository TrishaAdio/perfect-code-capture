const express = require("express");
const rateLimit = require("express-rate-limit");
const ctrl = require("../controllers/adminController");
const products = require("../controllers/productController");
const notices = require("../controllers/noticeController");
const uploadCtrl = require("../controllers/uploadController");
const requireAdmin = require("../middleware/adminAuth");
const ipWhitelist = require("../middleware/ipWhitelist");
const { upload, persistValidatedImage } = require("../middleware/upload");

const router = express.Router();

// Defence-in-depth: every admin route must come from a trusted IP. Authentication
// uses the admin JWT (Authorization: Bearer) issued by /login. We deliberately
// do NOT require an X-API-Key header — shipping a static key in the frontend
// bundle defeats the purpose. Strong admin password + IP whitelist + JWT +
// rate limit + audit log is the security perimeter.
router.use(ipWhitelist({ label: "admin" }));

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, try again later." },
});

const adminWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, slow down." },
});

const adminEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many email sends, try again later." },
});

router.post("/login", adminLoginLimiter, ctrl.login);
router.post("/logout", requireAdmin, ctrl.logout);
router.get("/me", requireAdmin, ctrl.me);
router.get("/stats/today", requireAdmin, ctrl.statsToday);
router.get("/stats/weekly", requireAdmin, ctrl.statsWeekly);
router.get("/earnings", requireAdmin, ctrl.earningsStats);
router.get("/users/emails", requireAdmin, ctrl.allUserEmails);
router.post("/send-email", requireAdmin, adminEmailLimiter, ctrl.sendEmail);

// Product management — admin only.
router.post("/products", requireAdmin, adminWriteLimiter, products.create);
router.delete("/products/:id", requireAdmin, adminWriteLimiter, products.remove);

// Global notices — admin CRUD.
router.get("/notices", requireAdmin, notices.listAll);
router.post("/notices", requireAdmin, adminWriteLimiter, notices.create);
router.patch("/notices/:id", requireAdmin, adminWriteLimiter, notices.update);
router.delete("/notices/:id", requireAdmin, adminWriteLimiter, notices.remove);

// Image upload — admin only. Field name: "image". Max 2MB. JPG/PNG/WEBP.
router.post(
  "/upload",
  requireAdmin,
  adminWriteLimiter,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (!err) return next();
      const status = err.status || (err.code === "LIMIT_FILE_SIZE" ? 413 : 400);
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Image must be 2MB or smaller"
          : err.message || "Upload failed";
      return res.status(status).json({ success: false, message });
    });
  },
  persistValidatedImage,
  uploadCtrl.uploadImage
);

module.exports = router;
