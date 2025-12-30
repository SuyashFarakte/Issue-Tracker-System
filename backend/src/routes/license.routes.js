import { Router } from "express";
import {
    uploadLicense,
    getAllLicenses,
    getExpiringLicenses,
    getLicensesByDepartment,
    getLicenseFile,
    downloadLicenseFile,
    updateLicense,
    deleteLicense,
    triggerExpiryCheck,
    getLicenseStats
} from "../controllers/license.controllers.js";
import { protect } from "../middlewares/auth.middlewares.js";

const router = Router()

// Admin routes
router.route("/upload").post(protect, uploadLicense)
router.route("/").get(protect, getAllLicenses)
router.route("/all").get(protect, getAllLicenses) // Matches fetchLicenses in frontend
router.route("/expiring").get(protect, getExpiringLicenses)
router.route("/department").get(protect, getLicensesByDepartment)
router.route("/stats").get(protect, getLicenseStats)
router.route("/:id").get(protect, getLicenseFile)
router.route("/:id/download").get(protect, downloadLicenseFile)
router.route("/:id").put(protect, updateLicense)
router.route("/:id").delete(protect, deleteLicense)
router.route("/check-expiry").post(protect, triggerExpiryCheck)

export default router
