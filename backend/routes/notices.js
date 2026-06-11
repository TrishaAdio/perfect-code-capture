const express = require("express");
const ctrl = require("../controllers/noticeController");

const router = express.Router();

// Public: only active notices.
router.get("/", ctrl.listActive);

module.exports = router;
