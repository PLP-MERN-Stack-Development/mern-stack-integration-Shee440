import express from 'express';
import { addComment } from '../controllers/commentcontroller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/:postId/comments', auth, addComment);

export default router;