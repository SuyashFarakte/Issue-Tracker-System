import { Router } from "express";
import { 
    admintCreateuser,
    getAllusers,
    adminUpdateuser,
    adminDeleteuser,
    adminResetuserPassword,
} from "../controllers/user.controllers.js";

import { 
    getDepartments,
    addDepartment, 
    deleteDepartment, 
    updateDepartment
} from "../controllers/department.controllers.js";

import {
    uploadLicense,
    getAllLicenses,
    updateLicense,
    deleteLicense,
} from "../controllers/license.controllers.js";

import { protect } from "../middlewares/auth.middlewares.js";

const router = Router()

// Admin-specific user management routes
router.route("/users").get(protect, getAllusers)
router.route("/register").post(protect, admintCreateuser) // Matches /api/v1/users/admin/register
router.route("/users/:userId").put(protect, adminUpdateuser)
router.route("/users/:userId").delete(protect, adminDeleteuser)
router.route("/users/:userId/reset-password").post(protect, adminResetuserPassword)

// Admin-specific department management routes
router.route("/departments").get(protect, getDepartments)
router.route("/departments").post(protect, addDepartment)
router.route("/departments/:departmentId").put(protect, updateDepartment)
router.route("/departments/:departmentId").delete(protect, deleteDepartment)

// Admin-specific license management routes
// router.route("/licenses").get(protect, getAllLicenses)
// router.route("/licenses").post(protect, uploadLicense)
// router.route("/licenses/:licenseId").get(protect, getLicenseById)
// router.route("/licenses/:licenseId").put(protect, updateLicense)
// router.route("/licenses/:licenseId").delete(protect, deleteLicense)

export default router
