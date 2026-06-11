// Returns a clean RELATIVE path for an uploaded image.
// We deliberately do NOT include scheme/host (no ngrok, no domain).
// The frontend resolves relative paths against its configured API base,
// so the value stored in the DB is portable across environments.
exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No image file received" });
  }

  const filename = req.file.filename;
  const relPath = `/uploads/${filename}`;

  return res.status(201).json({
    success: true,
    imageUrl: relPath, // relative path — what gets stored in DB
    path: relPath,
    filename,
    size: req.file.size,
  });
};
