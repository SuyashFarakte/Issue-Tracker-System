import { Router } from "express";
import authRouter from "./auth.routes.js";
import issueRouter from "./issue.routes.js";
import licenseRouter from "./license.routes.js";
import adminRouter from "./admin.routes.js";
import departmentRouter from "./department.routes.js";

const router = Router()

router.use("/auth", authRouter)
router.use("/issues", issueRouter)
router.use("/licenses", licenseRouter)
router.use("/admin", adminRouter)
router.use("/departments", departmentRouter)
router.use("/users/departments", departmentRouter)

export default router