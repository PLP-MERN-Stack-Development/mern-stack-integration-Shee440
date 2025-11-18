import Comment from '../models/comment.js';
import Post from '../models/post.js';

export const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comment = await Comment.create({
      content,
      author: req.user._id,
      post: postId
    });

    await comment.populate('author', 'username');

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};