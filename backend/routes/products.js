const express = require("express");
const ctrl = require("../controllers/productController");

const router = express.Router();

// Public catalogue.
router.get("/", ctrl.list);
router.get("/:id", ctrl.getOne);

module.exports = router;
