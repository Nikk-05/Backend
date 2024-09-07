import { Router } from "express";
import {changeCurrentPassword, getCurrentUser, loginUser, logoutUser, registerUser, updateAccountDetails} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route('/register').post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)
router.route('/login').post(loginUser)
// Secure routes
router.route('/logout').post(verifyJWT,logoutUser)
router.route('/newpassword').post(verifyJWT,changeCurrentPassword)
router.route('/details').get(verifyJWT,getCurrentUser)
router.route('update').get(verifyJWT,updateAccountDetails)



export default router;