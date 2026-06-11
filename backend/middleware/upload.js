const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

// Resolve uploads directory at backend/uploads (sibling of this file's parent).
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// Magic-byte signatures. We validate the actual file bytes after multer
// receives them — never trust the client-provided MIME or extension.
function detectImageType(buf) {
  if (!buf || buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
    return "image/png";
  // WEBP: "RIFF"...."WEBP"
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return "image/webp";
  return null;
}

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
    return cb(
      Object.assign(new Error("Only JPG, PNG and WEBP images are allowed"), {
        status: 400,
      })
    );
  }
  cb(null, true);
};

// In-memory storage so we can magic-byte validate BEFORE writing to disk.
// 2MB cap is small — memory pressure is not a concern.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

// Express middleware: validates magic bytes, then atomically writes file
// to uploadsDir with a random unguessable name. Sets req.file.filename and
// req.file.path to match the historical disk-storage shape.
function persistValidatedImage(req, res, next) {
  if (!req.file) return next();
  const detected = detectImageType(req.file.buffer);
  if (!detected || !ALLOWED_MIME.has(detected)) {
    return res.status(400).json({
      success: false,
      message: "File content is not a valid JPG, PNG or WEBP image",
    });
  }
  // Force extension to match the actual detected type — refuse polyglots.
  const extByType = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  const ext = extByType[detected];
  const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
  const fullPath = path.join(uploadsDir, filename);
  try {
    fs.writeFileSync(fullPath, req.file.buffer, { mode: 0o644 });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to save upload" });
  }
  req.file.filename = filename;
  req.file.path = fullPath;
  req.file.mimetype = detected;
  // Drop the buffer so we don't keep duplicate copies in memory.
  req.file.buffer = null;
  next();
}

module.exports = { upload, uploadsDir, persistValidatedImage };
