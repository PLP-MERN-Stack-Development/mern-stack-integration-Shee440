const express = require('express');
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  addComment,
  searchPosts
} = require('../controllers/postcontroller');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const upload = require('../utils/upload');

const router = express.Router();

// Validation rules
const postValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').isMongoId().withMessage('Valid category ID is required')
];

router.get('/', getPosts);
router.get('/search', searchPosts);
router.get('/:id', getPost);
router.post('/', auth, upload.single('featuredImage'), postValidation, createPost);
router.put('/:id', auth, upload.single('featuredImage'), postValidation, updatePost);
router.delete('/:id', auth, deletePost);
router.post('/:postId/comments', auth, addComment);

module.exports = router;