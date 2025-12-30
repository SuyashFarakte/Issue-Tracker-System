import { Router } from "express";
import {
    getDepartments,
    addDepartment,
    deleteDepartment,
    updateDepartment
} from "../controllers/department.controllers.js";
import { protect } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route("/").get(protect, getDepartments)
router.route("/").post(protect, addDepartment)
router.route("/:departmentId").put(protect, updateDepartment)
router.route("/:departmentId").delete(protect, deleteDepartment)

export default router
