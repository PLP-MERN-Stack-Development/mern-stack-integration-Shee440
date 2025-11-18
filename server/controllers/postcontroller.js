const Post = require('../models/post');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Get all posts with pagination and filtering
exports.getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = { isPublished: true };
    
    // Filter by category
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Search by title or content
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }

    const posts = await Post.find(filter)
      .populate('author', 'username')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    res.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single post by ID or slug
exports.getPost = async (req, res, next) => {
  try {
    let post;
    
    // Check if the parameter is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      post = await Post.findById(req.params.id)
        .populate('author', 'username email')
        .populate('category', 'name')
        .populate('comments.user', 'username');
    } else {
      // If not ObjectId, treat as slug
      post = await Post.findOne({ slug: req.params.id })
        .populate('author', 'username email')
        .populate('category', 'name')
        .populate('comments.user', 'username');
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Increment view count
    await post.incrementViewCount();

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// Create new post
exports.createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title, content, category, tags, excerpt, isPublished } = req.body;
    
    const postData = {
      title,
      content,
      category,
      author: req.user._id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPublished: isPublished === 'true'
    };

    // Add excerpt if provided, otherwise generate from content
    if (excerpt) {
      postData.excerpt = excerpt;
    } else {
      postData.excerpt = content.substring(0, 200) + '...';
    }

    if (req.file) {
      postData.featuredImage = `/uploads/${req.file.filename}`;
    }

    const post = await Post.create(postData);
    await post.populate('author', 'username');
    await post.populate('category', 'name');

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// Update post
exports.updatePost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post or is admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }

    const { title, content, category, tags, excerpt, isPublished } = req.body;
    
    const updateData = {
      title,
      content,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPublished: isPublished === 'true'
    };

    // Update excerpt if provided or if content changed
    if (excerpt) {
      updateData.excerpt = excerpt;
    } else if (content && content !== post.content) {
      updateData.excerpt = content.substring(0, 200) + '...';
    }

    if (req.file) {
      updateData.featuredImage = `/uploads/${req.file.filename}`;
    }

    post = await Post.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      {
        new: true,
        runValidators: true
      }
    ).populate('author', 'username').populate('category', 'name');

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// Delete post
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user owns the post or is admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Add comment to post
exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const { postId } = req.params;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Use the schema method to add comment
    await post.addComment(req.user._id, content);
    
    // Fetch updated post with populated comments
    const updatedPost = await Post.findById(postId)
      .populate('comments.user', 'username');

    res.status(201).json({
      success: true,
      data: updatedPost.comments
    });
  } catch (error) {
    next(error);
  }
};

// Search posts
exports.searchPosts = async (req, res, next) => {
  try {
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const posts = await Post.find({
      isPublished: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })
      .populate('author', 'username')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    next(error);
  }
};