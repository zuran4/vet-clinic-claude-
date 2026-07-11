import express from "express";

import validateBody from "../../validators/appointments/validateBody.js";
import checkOverlap from "../../middlewares/appointments/checkOverlap.js";
import requirePermission from "../../middlewares/auth/requirePermission.js";
import {
  getAllAppointments,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  searchAppointmentsHandler,
} from "../../controllers/appointments/base.js";

const router = express.Router();

router.get("/search",       requirePermission("appointments:read"),   searchAppointmentsHandler);
router.get("/",              requirePermission("appointments:read"),   getAllAppointments);
router.post("/",             requirePermission("appointments:write"),  validateBody, checkOverlap, createAppointment);
router.put("/:id",           requirePermission("appointments:write"),  validateBody, checkOverlap, updateAppointment);
router.patch("/:id/status",  requirePermission("appointments:write"),  updateAppointmentStatus);
router.delete("/:id",        requirePermission("appointments:delete"), deleteAppointment);

export default router;
