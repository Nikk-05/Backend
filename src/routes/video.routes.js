import { Router } from 'express'
import {upload} from '../middlewares/multer.middleware.js'
import { publishAVideo } from '../controllers/video.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router();

router.use(verifyJWT) // Middleware to apply on every route

// Upload video file
router.route('/all')
.post(upload.fields([
        {
            name:'videoFile',
            maxCount: 1,
            limits: { fileSize: 100 * 1024 * 1024 } // 100 MB
        },
        {
            name: 'thumbnail',
            maxCount: 1,
            limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
        }
    ]),
    publishAVideo
)


export default router;
