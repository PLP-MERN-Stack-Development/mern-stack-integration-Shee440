import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth.context.jsx';
import { postAPI } from '../services/api';
import { useApi } from '../hooks/useAPi.js';

// Reading time calculator
const calculateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const time = Math.ceil(words / wordsPerMinute);
  return time;
};

// Markdown to HTML converter (basic)
const markdownToHtml = (text) => {
  if (!text) return '';
  
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold & Italic
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\[]+)\]\(([^\)]+)\)/gim, '<a href="$2" class="text-primary-600 hover:text-primary-700 underline">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Code blocks (basic)
    .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-1 rounded">$1</code>');
};

// Generate table of contents from headings
const generateTableOfContents = (content) => {
  const headings = content.match(/^(#{1,3})\s+(.+)$/gm);
  if (!headings) return [];

  return headings.map(heading => {
    const level = heading.match(/^(#{1,3})/)[0].length;
    const text = heading.replace(/^#{1,3}\s+/, '');
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return { level, text, id };
  });
};

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const { user } = useAuth();
  const { loading, error, callApi } = useApi();
  const shareButtonRef = useRef(null);

  const fetchPost = async () => {
    const response = await callApi(postAPI.getPost, id);
    if (response) {
      setPost(response.data);
      setIsLiked(response.data.isLiked || false);
      setLikeCount(response.data.likeCount || 0);
      fetchRelatedPosts(response.data.category?._id, response.data._id);
    }
  };

  const fetchRelatedPosts = async (categoryId, excludePostId) => {
    if (!categoryId) return;
    
    try {
      const response = await postAPI.getPosts({ 
        category: categoryId, 
        limit: 3,
        exclude: excludePostId 
      });
      if (response.data) {
        setRelatedPosts(response.data.filter(post => post._id !== excludePostId).slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching related posts:', error);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  useEffect(() => {
    // Close share menu when clicking outside
    const handleClickOutside = (event) => {
      if (shareButtonRef.current && !shareButtonRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await callApi(postAPI.addComment, id, { 
        content: comment,
        parentComment: replyTo 
      });
      setComment('');
      setReplyTo(null);
      fetchPost();
    } catch (error) {
      console.error('Add comment error:', error);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      // This would require a new API endpoint for editing comments
      // await callApi(postAPI.updateComment, id, commentId, { content: editContent });
      setEditingComment(null);
      setEditContent('');
      fetchPost();
    } catch (error) {
      console.error('Edit comment error:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      // This would require a new API endpoint for deleting comments
      // await callApi(postAPI.deleteComment, id, commentId);
      fetchPost();
    } catch (error) {
      console.error('Delete comment error:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // This would require a new API endpoint for liking posts
      // await callApi(postAPI.likePost, id);
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = post?.title;

    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
    }
    setShowShareMenu(false);
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    try {
      await callApi(postAPI.deletePost, id);
      navigate('/');
    } catch (error) {
      console.error('Delete post error:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPostOwner = user && post && user.id === post.author?._id;
  const readingTime = post ? calculateReadingTime(post.content) : 0;
  const tableOfContents = post ? generateTableOfContents(post.content) : [];

  if (loading && !post) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-lg">Loading post...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Error loading post</h3>
          <p className="text-red-600">{error}</p>
          <Link to="/" className="btn btn-primary mt-4">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Post not found</h3>
          <p className="text-gray-500 mb-4">The post you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="btn btn-primary">
            Browse All Posts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Table of Contents Sidebar */}
        {tableOfContents.length > 0 && (
          <div className="lg:col-span-1">
            <div className={`sticky top-8 ${showToc ? 'block' : 'hidden lg:block'}`}>
              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Table of Contents</h4>
                  <button
                    onClick={() => setShowToc(false)}
                    className="lg:hidden text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="card-body">
                  <nav className="space-y-2">
                    {tableOfContents.map((item, index) => (
                      <a
                        key={index}
                        href={`#${item.id}`}
                        className={`block text-sm hover:text-primary-600 transition-colors ${
                          item.level === 1 ? 'font-semibold' : 
                          item.level === 2 ? 'ml-2' : 'ml-4 text-gray-600'
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={tableOfContents.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}>
          <article className="card">
            {/* Featured Image */}
            {post.featuredImage && post.featuredImage !== 'default-post.jpg' && (
              <img 
                src={`http://localhost:5000${post.featuredImage}`} 
                alt={post.title}
                className="w-full h-64 lg:h-96 object-cover"
              />
            )}
            
            <div className="p-6 lg:p-8">
              {/* Post Actions Bar */}
              <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                  {/* Like Button */}
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isLiked 
                        ? 'bg-red-50 text-red-600 border border-red-200' 
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <svg 
                      className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} 
                      fill={isLiked ? 'currentColor' : 'none'} 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{likeCount}</span>
                  </button>

                  {/* Share Button */}
                  <div className="relative" ref={shareButtonRef}>
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share
                    </button>

                    {showShareMenu && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <button
                          onClick={() => handleShare('copy')}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 rounded-t-lg"
                        >
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy Link
                        </button>
                        <button
                          onClick={() => handleShare('twitter')}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50"
                        >
                          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                          Twitter
                        </button>
                        <button
                          onClick={() => handleShare('facebook')}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50"
                        >
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                          </svg>
                          Facebook
                        </button>
                        <button
                          onClick={() => handleShare('linkedin')}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 rounded-b-lg"
                        >
                          <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                          LinkedIn
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Table of Contents Toggle (Mobile) */}
                  {tableOfContents.length > 0 && (
                    <button
                      onClick={() => setShowToc(true)}
                      className="lg:hidden flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      Contents
                    </button>
                  )}

                  {/* Edit/Delete Buttons for Owner */}
                  {isPostOwner && (
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/edit-post/${id}`}
                        className="btn btn-outline flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={handleDeletePost}
                        className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Post Header */}
              <header className="mb-8">
                <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
                  <span className="tag bg-primary-500 text-white">
                    {post.category?.name}
                  </span>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{formatDate(post.createdAt)}</span>
                    <span>•</span>
                    <span>{post.viewCount} views</span>
                    <span>•</span>
                    <span>{readingTime} min read</span>
                  </div>
                </div>
                
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {post.title}
                </h1>

                {/* Author Profile Card */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {post.author?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{post.author?.username}</div>
                    <div className="text-sm text-gray-600">Blog Author</div>
                  </div>
                </div>
              </header>

              {/* Excerpt */}
              {post.excerpt && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
                  <p className="text-lg text-primary-800 leading-relaxed">{post.excerpt}</p>
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mb-8">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="tag bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Content with Markdown */}
              <div className="prose max-w-none mb-8">
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
                />
              </div>

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <section className="border-t pt-8 mb-8">
                  <h3 className="text-2xl font-bold mb-6">Related Posts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {relatedPosts.map(relatedPost => (
                      <Link
                        key={relatedPost._id}
                        to={`/posts/${relatedPost._id}`}
                        className="card post-card"
                      >
                        {relatedPost.featuredImage && relatedPost.featuredImage !== 'default-post.jpg' && (
                          <img 
                            src={`http://localhost:5000${relatedPost.featuredImage}`} 
                            alt={relatedPost.title}
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {relatedPost.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {calculateReadingTime(relatedPost.content)} min read
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Comments Section */}
              <section className="border-t pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">
                    Comments ({post.comments?.length || 0})
                  </h3>
                  {tableOfContents.length > 0 && (
                    <button
                      onClick={() => setShowToc(!showToc)}
                      className="lg:hidden btn btn-ghost"
                    >
                      {showToc ? 'Hide Contents' : 'Show Contents'}
                    </button>
                  )}
                </div>

                {/* Add Comment Form */}
                {user ? (
                  <form onSubmit={handleAddComment} className="mb-8">
                    {replyTo && (
                      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <span className="text-sm text-blue-700">
                          Replying to comment
                        </span>
                        <button
                          type="button"
                          onClick={() => setReplyTo(null)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <div className="mb-4">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={replyTo ? "Write your reply..." : "Add a comment..."}
                        rows="4"
                        className="form-textarea"
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                      >
                        {loading ? 'Posting...' : replyTo ? 'Post Reply' : 'Post Comment'}
                      </button>
                      {replyTo && (
                        <button
                          type="button"
                          onClick={() => setReplyTo(null)}
                          className="btn btn-ghost"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center mb-6">
                    <p className="text-gray-600 mb-3">
                      Please <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">login</Link> to join the discussion.
                    </p>
                    <Link to="/login" className="btn btn-primary">
                      Sign In to Comment
                    </Link>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-6">
                  {post.comments && post.comments.length > 0 ? (
                    post.comments.map((comment) => (
                      <div key={comment._id || comment.createdAt} className="comment">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {comment.user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">
                                {comment.user?.username || 'Unknown User'}
                              </span>
                              <span className="text-sm text-gray-500 ml-3">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Comment Actions */}
                          {user && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setReplyTo(comment._id)}
                                className="text-gray-400 hover:text-primary-600 transition-colors"
                                title="Reply"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                              </button>
                              {(user.id === comment.user?._id || isPostOwner) && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingComment(comment._id);
                                      setEditContent(comment.content);
                                    }}
                                    className="text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Edit"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(comment._id)}
                                    className="text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Comment Content */}
                        {editingComment === comment._id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows="3"
                              className="form-textarea"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditComment(comment._id)}
                                className="btn btn-primary btn-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingComment(null)}
                                className="btn btn-ghost btn-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {comment.content}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-gray-500 text-lg">No comments yet</p>
                      <p className="text-gray-400 mt-1">Be the first to share your thoughts!</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;