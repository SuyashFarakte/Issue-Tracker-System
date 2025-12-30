import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails
} from "../controllers/user.controllers.js";
import { protect } from "../middlewares/auth.middlewares.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/logout").post(protect, logoutUser)
router.route("/refresh-token").post(protect, refreshAccessToken)
router.route("/change-password").post(protect, changeCurrentPassword)
router.route("/current-user").get(protect, getCurrentUser)
router.route("/update-account").patch(protect, updateAccountDetails)

export default router
