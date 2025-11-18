import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/auth.context.jsx';
import { postAPI, categoryAPI } from '../services/api';
import { useApi } from '../hooks/useAPi.js';

const EditPost = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    excerpt: '',
    isPublished: true,
    featuredImage: null
  });
  const [postStats, setPostStats] = useState({
    likes: 0,
    comments: 0,
    readingTime: 0
  });
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [autoGenerateExcerpt, setAutoGenerateExcerpt] = useState(true);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, error, callApi } = useApi();



  // Utility functions
  const generateExcerpt = (content, maxLength = 200) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  const calculateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const validateFileSize = (file, maxSizeMB = 5) => {
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size must be less than ${maxSizeMB}MB`;
    }
    return null;
  };

  const validateFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']) => {
    if (!allowedTypes.includes(file.type)) {
      return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }
    return null;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000${imagePath}`;
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPost();
    fetchCategories();
  }, [user, navigate, id]);

  const fetchPost = async () => {
    try {
      const response = await callApi(postAPI.getPost, id);
      if (response) {
        const post = response.data;
        setFormData({
          title: post.title || '',
          content: post.content || '',
          category: post.category?._id || '',
          tags: post.tags?.join(', ') || '',
          excerpt: post.excerpt || '',
          isPublished: post.isPublished || true,
          featuredImage: null
        });

        // Set post statistics
        setPostStats({
          likes: post.likes || 0,
          comments: post.comments || 0,
          readingTime: calculateReadingTime(post.content || '')
        });
        
        if (post.featuredImage && post.featuredImage !== 'default-post.jpg') {
          setCurrentImage(post.featuredImage);
          setImagePreview(getImageUrl(post.featuredImage));
        }
        
        // Check if excerpt was auto-generated
        if (post.excerpt && post.excerpt === post.content?.substring(0, 200) + '...') {
          setAutoGenerateExcerpt(true);
        } else {
          setAutoGenerateExcerpt(false);
        }
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      navigate('/');
    }
  };

  const fetchCategories = async () => {
    const response = await callApi(categoryAPI.getCategories);
    if (response) {
      setCategories(response.data);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Auto-generate excerpt when content changes and auto-generate is enabled
    if (name === 'content' && autoGenerateExcerpt && value.length > 0) {
      const generatedExcerpt = generateExcerpt(value);
      setFormData(prev => ({
        ...prev,
        excerpt: generatedExcerpt
      }));
    }

    // Update reading time when content changes
    if (name === 'content') {
      setPostStats(prev => ({
        ...prev,
        readingTime: calculateReadingTime(value)
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const typeError = validateFileType(file);
    if (typeError) {
      setFormErrors(prev => ({
        ...prev,
        featuredImage: typeError
      }));
      return;
    }

    // Validate file size
    const sizeError = validateFileSize(file);
    if (sizeError) {
      setFormErrors(prev => ({
        ...prev,
        featuredImage: sizeError
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      featuredImage: file
    }));

    // Clear any previous errors
    setFormErrors(prev => ({
      ...prev,
      featuredImage: ''
    }));
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      featuredImage: null
    }));
    setImagePreview(null);
    setCurrentImage('');
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Title cannot be more than 100 characters';
    }

    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (formData.excerpt && formData.excerpt.length > 200) {
      errors.excerpt = 'Excerpt cannot be more than 200 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const postData = new FormData();
      postData.append('title', formData.title);
      postData.append('content', formData.content);
      postData.append('category', formData.category);
      postData.append('tags', formData.tags);
      postData.append('excerpt', formData.excerpt);
      postData.append('isPublished', formData.isPublished.toString());
      
      if (formData.featuredImage) {
        postData.append('featuredImage', formData.featuredImage);
      }

      await callApi(postAPI.updatePost, id, postData);
      navigate(`/posts/${id}`);
    } catch (error) {
      console.error('Update post error:', error);
    }
  };

  const handleExcerptToggle = (e) => {
    const shouldAutoGenerate = e.target.checked;
    setAutoGenerateExcerpt(shouldAutoGenerate);
    
    if (shouldAutoGenerate && formData.content) {
      const generatedExcerpt = generateExcerpt(formData.content);
      setFormData(prev => ({
        ...prev,
        excerpt: generatedExcerpt
      }));
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate(`/posts/${id}`);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div 
      className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg fade-in"
      style={cssVariables}
    >
      {/* Header Section with Stats */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Edit Post</h2>
            <p className="text-gray-600">Update your blog post with new content and images.</p>
          </div>
          
          {/* Stats Badges */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-blue-100 transition-colors cursor-default">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {postStats.readingTime} min read
            </div>
            
            <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-red-100 transition-colors cursor-default">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              {postStats.likes} likes
            </div>
            
            <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-green-100 transition-colors cursor-default">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
              </svg>
              {postStats.comments} comments
            </div>
          </div>
        </div>

        {/* Excerpt Preview */}
        {formData.excerpt && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-4 rounded-r-lg hover:shadow-sm transition-shadow">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Excerpt Preview</h4>
                <p className="text-blue-800 text-sm leading-relaxed">{formData.excerpt}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center hover:bg-red-50 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="title">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`form-input ${formErrors.title ? 'border-red-500 hover:border-red-600' : 'hover:border-gray-400'} transition-colors`}
            placeholder="Enter a compelling title for your post"
          />
          <div className="flex justify-between mt-1">
            {formErrors.title && (
              <span className="form-error hover:bg-red-50 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {formErrors.title}
              </span>
            )}
            <span className="text-sm text-gray-500 ml-auto">
              {formData.title.length}/100 characters
            </span>
          </div>
        </div>

        {/* Category Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="category">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`form-select ${formErrors.category ? 'border-red-500 hover:border-red-600' : 'hover:border-gray-400'} transition-colors`}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          {formErrors.category && (
            <span className="form-error hover:bg-red-50 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {formErrors.category}
            </span>
          )}
        </div>

        {/* Tags Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="tags">
            Tags
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="form-input hover:border-gray-400 transition-colors"
            placeholder="react, javascript, web-development (comma separated)"
          />
          <p className="text-gray-500 text-sm mt-1">
            Separate tags with commas. These help users discover your content.
          </p>
        </div>

        {/* Content Field */}
        <div className="form-group">
          <div className="flex items-center justify-between mb-2">
            <label className="form-label" htmlFor="content">
              Content *
            </label>
            <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors">
              {postStats.readingTime} min read • {formData.content.split(/\s+/).filter(word => word.length > 0).length} words
            </div>
          </div>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows="15"
            className={`form-textarea ${formErrors.content ? 'border-red-500 hover:border-red-600' : 'hover:border-gray-400'} transition-colors`}
            placeholder="Write your post content here... You can use markdown formatting."
          />
          {formErrors.content && (
            <span className="form-error hover:bg-red-50 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {formErrors.content}
            </span>
          )}
        </div>

        {/* Excerpt Field */}
        <div className="form-group">
          <div className="flex items-center justify-between mb-2">
            <label className="form-label" htmlFor="excerpt">
              Excerpt
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoExcerpt"
                checked={autoGenerateExcerpt}
                onChange={handleExcerptToggle}
                className="mr-2 rounded text-primary-600 focus:ring-primary-500 hover:ring-2 hover:ring-primary-200 transition-all"
              />
              <label htmlFor="autoExcerpt" className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors">
                Auto-generate from content
              </label>
            </div>
          </div>
          <textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            rows="3"
            disabled={autoGenerateExcerpt}
            className={`form-textarea ${formErrors.excerpt ? 'border-red-500 hover:border-red-600' : 'hover:border-gray-400'} transition-colors ${
              autoGenerateExcerpt ? 'bg-gray-100 text-gray-500 cursor-not-allowed hover:bg-gray-100' : ''
            }`}
            placeholder="Brief description of your post (will be auto-generated if enabled)"
          />
          <div className="flex justify-between mt-1">
            {formErrors.excerpt && (
              <span className="form-error hover:bg-red-50 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {formErrors.excerpt}
              </span>
            )}
            <span className="text-sm text-gray-500 ml-auto">
              {formData.excerpt.length}/200 characters
            </span>
          </div>
        </div>

        {/* Featured Image Field */}
        <div className="form-group">
          <label className="form-label" htmlFor="featuredImage">
            Featured Image
          </label>
          <div className="space-y-4">
            {(imagePreview || currentImage) ? (
              <div className="relative group">
                <img 
                  src={imagePreview || getImageUrl(currentImage)} 
                  alt="Preview" 
                  className="max-w-full h-64 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-lg flex items-center justify-center">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 transition-all duration-200 transform scale-0 group-hover:scale-100 hover:scale-110 shadow-lg"
                    title="Remove image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="absolute top-3 right-3">
                  <span className="bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm hover:bg-opacity-80 transition-colors">
                    {currentImage && !imagePreview ? 'Current Image' : 'New Image'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 hover:bg-primary-25 transition-all duration-300 cursor-pointer group">
                <input
                  type="file"
                  id="featuredImage"
                  name="featuredImage"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <label
                  htmlFor="featuredImage"
                  className="cursor-pointer block group-hover:scale-105 transition-transform duration-300"
                >
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-primary-600 hover:text-primary-700 font-medium text-lg group-hover:text-primary-700 transition-colors">
                    Click to upload an image
                  </span>
                  <p className="text-gray-500 text-sm mt-2 group-hover:text-gray-600 transition-colors">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </label>
              </div>
            )}
            {formErrors.featuredImage && (
              <span className="form-error hover:bg-red-50 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {formErrors.featuredImage}
              </span>
            )}
          </div>
        </div>

        {/* Publishing Options */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            Publishing Options
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-white transition-colors duration-200">
              <input
                type="radio"
                name="publishOption"
                checked={formData.isPublished}
                onChange={() => setFormData(prev => ({ ...prev, isPublished: true }))}
                className="mt-1 text-primary-600 focus:ring-primary-500 hover:ring-2 hover:ring-primary-200 transition-all"
              />
              <div>
                <span className="font-medium text-gray-700">Publish immediately</span>
                <p className="text-sm text-gray-500 mt-1">Your post will be visible to all users.</p>
              </div>
            </label>
            
            <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-white transition-colors duration-200">
              <input
                type="radio"
                name="publishOption"
                checked={!formData.isPublished}
                onChange={() => setFormData(prev => ({ ...prev, isPublished: false }))}
                className="mt-1 text-primary-600 focus:ring-primary-500 hover:ring-2 hover:ring-primary-200 transition-all"
              />
              <div>
                <span className="font-medium text-gray-700">Save as draft</span>
                <p className="text-sm text-gray-500 mt-1">Your post will be saved but not published.</p>
              </div>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1 relative overflow-hidden group hover:shadow-lg transition-all duration-300"
          >
            {loading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Updating Post...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {formData.isPublished ? 'Update Post' : 'Save as Draft'}
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-outline flex-1 hover:bg-gray-50 hover:shadow-md transition-all duration-300 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>

          <button
            type="button"
            onClick={() => navigate(`/posts/${id}`)}
            className="btn btn-ghost hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm transition-all duration-300 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPost;