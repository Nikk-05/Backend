import { Router } from 'express'
import {upload} from '../middlewares/multer.middleware.js'
import { getAllVideos, getVideoById, publishAVideo } from '../controllers/video.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router();

router.use(verifyJWT) // Middleware to apply on every route

// Search for videos
router.route('/search').get(getAllVideos)

// Publish a new video
router.route('/upload')
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

router.route('/:id')
.get(getVideoById)



export default router;
