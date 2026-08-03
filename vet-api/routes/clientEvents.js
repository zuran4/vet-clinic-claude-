import express from "express";
import reportClientEvent from "../controllers/clientEvents/report.js";

const router = express.Router();

router.post("/", reportClientEvent);

export default router;
