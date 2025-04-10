import { Router } from "express";
import { getCurrentAdmin, loginAdmin, logoutAdmin, registerAdmin } from "../controllers/admin.controller.js";
import {  verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route("/register").post(registerAdmin);

router.route("/login").post(loginAdmin);

router.route('/logout').post(verifyJWT,logoutAdmin);

router.route("/current-admin").post(verifyJWT,getCurrentAdmin);

export default router;