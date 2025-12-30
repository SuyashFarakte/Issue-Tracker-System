import { Router } from "express";
import { 
    createIssue,
    getissue,
    updateResponses,
    getIssueforuser,
    completeReport,
    acknowledgeResponse,
    fetchReport,
    getAdmin
} from "../controllers/issue.controllers.js";
import { protect } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route("/raise-issue").post(protect, createIssue)
router.route("/get-issue").get(protect, getissue)
router.route("/get-issue-for-user").get(protect, getIssueforuser)
router.route("/update-response").put(protect, updateResponses)
router.route("/complete-report").post(protect, completeReport)
router.route("/acknowledge-time").post(protect, acknowledgeResponse)
router.route("/fetch-report").get(protect, fetchReport)
router.route("/get-admin").get(protect, getAdmin)

export default router
