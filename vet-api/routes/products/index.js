// routes/products/index.js
import express from "express";

import baseRoutes from "./base.js";
import stockRoutes from "./stock.js";

const router = express.Router();
router.use("/", baseRoutes);
router.use("/", stockRoutes);

export default router;
