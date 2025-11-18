import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth.context.jsx';
import { postAPI, categoryAPI } from '../services/api';
import { useApi } from '../hooks/useAPi.js';

// Utility functions
const generateExcerpt = (content, maxLength = 200) => {
  const plainText = content.replace(/<[^>]*>/g, '');
  if (plainText.length <= maxLength) return plainText;
  return plainText.substring(0, maxLength) + '...';
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

// Markdown preview component
const MarkdownPreview = ({ content }) => {
  const markdownToHtml = (text) => {
    if (!text) return '';
    
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-5">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      .replace(/\[([^\[]+)\]\(([^\)]+)\)/gim, '<a href="$2" class="text-primary-600 hover:text-primary-700 underline">$1</a>')
      .replace(/\n/g, '<br>')
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
      .replace(/```([^`]+)```/gim, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gim, '<ul class="list-disc list-inside my-4">$1</ul>');
  };

  return (
    <div 
      className="prose max-w-none p-6 bg-white border border-gray-200 rounded-lg min-h-64"
      dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
    />
  );
};

// SEO Preview Component
const SEOPreview = ({ title, excerpt, slug }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-md">
      <div className="mb-2">
        <div className="text-blue-600 text-sm truncate">yourblog.com/posts/{slug || 'post-title'}</div>
        <div className="text-lg text-gray-900 font-medium leading-snug truncate">
          {title || 'Post Title'}
        </div>
      </div>
      <div className="text-gray-600 text-sm leading-relaxed line-clamp-2">
        {excerpt || 'Post description will appear here...'}
      </div>
    </div>
  );
};

const CreatePost = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    excerpt: '',
    metaDescription: '',
    slug: '',
    isPublished: true,
    publishAt: '',
    featuredImage: null
  });
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageGallery, setImageGallery] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [autoGenerateExcerpt, setAutoGenerateExcerpt] = useState(true);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState(false);
  const [showSEOPreview, setShowSEOPreview] = useState(false);
  const [editorMode, setEditorMode] = useState('markdown'); // 'markdown' or 'rich'
  const [lastSaved, setLastSaved] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, error, callApi } = useApi();
  const fileInputRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Calculate word and character count
  useEffect(() => {
    const words = formData.content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(formData.content.length);
  }, [formData.content]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (formData.title || formData.content) {
      autoSaveTimerRef.current = setTimeout(() => {
        autoSaveDraft();
      }, 30000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData]);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title]);

  // Auto-generate meta description from excerpt
  useEffect(() => {
    if (formData.excerpt && !formData.metaDescription) {
      setFormData(prev => ({ ...prev, metaDescription: formData.excerpt }));
    }
  }, [formData.excerpt]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCategories();
    loadDraft();
  }, [user, navigate]);

  const fetchCategories = async () => {
    const response = await callApi(categoryAPI.getCategories);
    if (response) {
      setCategories(response.data);
    }
  };

  const loadDraft = () => {
    const draft = localStorage.getItem('post-draft');
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      setFormData(prev => ({ ...prev, ...parsedDraft }));
      setLastSaved('Draft loaded from auto-save');
    }
  };

  const autoSaveDraft = () => {
    const draftData = {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags,
      excerpt: formData.excerpt,
      metaDescription: formData.metaDescription,
      slug: formData.slug
    };
    
    localStorage.setItem('post-draft', JSON.stringify(draftData));
    setLastSaved(new Date().toLocaleTimeString());
  };

  const clearDraft = () => {
    localStorage.removeItem('post-draft');
    setLastSaved(null);
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
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
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

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!formData.featuredImage) {
          // Set first image as featured image
          setFormData(prev => ({
            ...prev,
            featuredImage: file
          }));
          setImagePreview(e.target.result);
        }
        
        // Add to gallery
        setImageGallery(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          preview: e.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });

    // Clear any previous errors
    setFormErrors(prev => ({
      ...prev,
      featuredImage: ''
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary-400', 'bg-primary-50');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary-400', 'bg-primary-50');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary-400', 'bg-primary-50');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      const event = { target: { files } };
      handleImageChange(event);
    }
  };

  const removeImage = (imageId = null) => {
    if (imageId) {
      // Remove from gallery
      setImageGallery(prev => prev.filter(img => img.id !== imageId));
    } else {
      // Remove featured image
      setFormData(prev => ({
        ...prev,
        featuredImage: null
      }));
      setImagePreview(null);
    }
  };

  const setAsFeatured = (image) => {
    setFormData(prev => ({
      ...prev,
      featuredImage: image.file
    }));
    setImagePreview(image.preview);
  };

  const insertImageToContent = (imageUrl) => {
    const markdownImage = `\n![Image description](${imageUrl})\n`;
    setFormData(prev => ({
      ...prev,
      content: prev.content + markdownImage
    }));
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

    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
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
      postData.append('metaDescription', formData.metaDescription);
      postData.append('slug', formData.slug);
      postData.append('isPublished', formData.isPublished.toString());
      
      if (formData.publishAt) {
        postData.append('publishAt', formData.publishAt);
      }
      
      if (formData.featuredImage) {
        postData.append('featuredImage', formData.featuredImage);
      }

      // Append gallery images
      imageGallery.forEach((image, index) => {
        postData.append('galleryImages', image.file);
      });

      await callApi(postAPI.createPost, postData);
      clearDraft(); // Clear draft on successful submission
      navigate('/');
    } catch (error) {
      console.error('Create post error:', error);
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

  const formatMarkdown = (type) => {
    const textarea = document.getElementById('content');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    let formattedText = '';
    
    switch (type) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'heading':
        formattedText = `# ${selectedText}`;
        break;
      case 'list':
        formattedText = `- ${selectedText}`;
        break;
      default:
        return;
    }
    
    const newContent = formData.content.substring(0, start) + formattedText + formData.content.substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header with Stats */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Create New Post</h2>
            {lastSaved && (
              <p className="text-sm text-gray-500 mt-1">
                Auto-saved: {lastSaved}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{wordCount} words</span>
            <span>{charCount} characters</span>
            <span>{Math.ceil(wordCount / 200)} min read</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg mx-6 mt-6 p-4 flex items-start space-x-3">
          <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Title & Basic Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
                className={`form-input ${formErrors.title ? 'border-red-500' : ''}`}
                placeholder="Enter a compelling title for your post"
              />
              <div className="flex justify-between mt-1">
                {formErrors.title && (
                  <span className="form-error">{formErrors.title}</span>
                )}
                <span className="text-gray-500 text-sm ml-auto">
                  {formData.title.length}/100 characters
                </span>
              </div>
            </div>

            {/* Slug Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="slug">
                URL Slug
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">yourblog.com/posts/</span>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className={`form-input flex-1 ${formErrors.slug ? 'border-red-500' : ''}`}
                  placeholder="url-slug"
                />
              </div>
              {formErrors.slug && (
                <span className="form-error">{formErrors.slug}</span>
              )}
            </div>
          </div>

          {/* SEO Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="form-label">SEO Preview</label>
              <button
                type="button"
                onClick={() => setShowSEOPreview(!showSEOPreview)}
                className="btn btn-ghost btn-sm"
              >
                {showSEOPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>
            {showSEOPreview && (
              <SEOPreview
                title={formData.title}
                excerpt={formData.metaDescription || formData.excerpt}
                slug={formData.slug}
              />
            )}
          </div>
        </div>

        {/* Category & Tags */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              className={`form-select ${formErrors.category ? 'border-red-500' : ''}`}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {formErrors.category && (
              <span className="form-error">{formErrors.category}</span>
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
              className="form-input"
              placeholder="react, javascript, web-development (comma separated)"
            />
            <p className="text-gray-500 text-sm mt-1">
              Separate tags with commas. These help users discover your content.
            </p>
          </div>
        </div>

        {/* Content Editor */}
        <div className="form-group">
          <div className="flex items-center justify-between mb-4">
            <label className="form-label" htmlFor="content">
              Content *
            </label>
            <div className="flex items-center gap-2">
              {/* Markdown Toolbar */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => formatMarkdown('bold')}
                  className="p-2 rounded hover:bg-gray-200 transition-colors"
                  title="Bold"
                >
                  <span className="font-bold">B</span>
                </button>
                <button
                  type="button"
                  onClick={() => formatMarkdown('italic')}
                  className="p-2 rounded hover:bg-gray-200 transition-colors"
                  title="Italic"
                >
                  <span className="italic">I</span>
                </button>
                <button
                  type="button"
                  onClick={() => formatMarkdown('link')}
                  className="p-2 rounded hover:bg-gray-200 transition-colors"
                  title="Link"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => formatMarkdown('code')}
                  className="p-2 rounded hover:bg-gray-200 transition-colors"
                  title="Code"
                >
                  <code className="text-sm">{'</>'}</code>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowMarkdownPreview(!showMarkdownPreview)}
                className="btn btn-ghost btn-sm"
              >
                {showMarkdownPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>
          </div>

          {showMarkdownPreview ? (
            <MarkdownPreview content={formData.content} />
          ) : (
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="15"
              className={`form-textarea font-mono text-sm ${formErrors.content ? 'border-red-500' : ''}`}
              placeholder="Write your post content here... You can use markdown formatting."
            />
          )}
          {formErrors.content && (
            <span className="form-error">{formErrors.content}</span>
          )}
        </div>

        {/* Excerpt & Meta Description */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  className="mr-2 rounded text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="autoExcerpt" className="text-sm text-gray-600 cursor-pointer">
                  Auto-generate
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
              className={`form-textarea ${formErrors.excerpt ? 'border-red-500' : ''} ${
                autoGenerateExcerpt ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
              }`}
              placeholder="Brief description of your post (will be auto-generated if enabled)"
            />
            <div className="flex justify-between mt-1">
              {formErrors.excerpt && (
                <span className="form-error">{formErrors.excerpt}</span>
              )}
              <span className="text-gray-500 text-sm ml-auto">
                {formData.excerpt.length}/200 characters
              </span>
            </div>
          </div>

          {/* Meta Description Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="metaDescription">
              Meta Description
            </label>
            <textarea
              id="metaDescription"
              name="metaDescription"
              value={formData.metaDescription}
              onChange={handleChange}
              rows="3"
              className="form-textarea"
              placeholder="SEO meta description (defaults to excerpt)"
            />
            <p className="text-gray-500 text-sm mt-1">
              Recommended: 150-160 characters for SEO
            </p>
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="space-y-6">
          <label className="form-label">Images</label>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg text-gray-600 mb-2">
              Drag & drop images here or click to upload
            </p>
            <p className="text-sm text-gray-500">
              PNG, JPG, GIF up to 5MB each
            </p>
            {formErrors.featuredImage && (
              <span className="form-error mt-2">{formErrors.featuredImage}</span>
            )}
          </div>

          {/* Featured Image Preview */}
          {imagePreview && (
            <div className="form-group">
              <label className="form-label">Featured Image</label>
              <div className="relative inline-block">
                <img 
                  src={imagePreview} 
                  alt="Featured preview" 
                  className="w-64 h-48 object-cover rounded-lg shadow-md"
                />
                <button
                  type="button"
                  onClick={() => removeImage()}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Image Gallery */}
          {imageGallery.length > 0 && (
            <div className="form-group">
              <label className="form-label">Image Gallery</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imageGallery.map((image) => (
                  <div key={image.id} className="relative group">
                    <img 
                      src={image.preview} 
                      alt="Gallery preview" 
                      className="w-full h-32 object-cover rounded-lg shadow-md"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all rounded-lg flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAsFeatured(image)}
                        className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition transform scale-0 group-hover:scale-100"
                        title="Set as featured"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertImageToContent(image.preview)}
                        className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 transition transform scale-0 group-hover:scale-100"
                        title="Insert into content"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 transition transform scale-0 group-hover:scale-100"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Publishing Options */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Publishing Options</h3>
          
          <div className="space-y-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="publishOption"
                checked={formData.isPublished && !formData.publishAt}
                onChange={() => setFormData(prev => ({ ...prev, isPublished: true, publishAt: '' }))}
                className="mt-1 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="font-medium text-gray-700">Publish immediately</span>
                <p className="text-sm text-gray-500 mt-1">Your post will be visible to all users.</p>
              </div>
            </label>
            
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="publishOption"
                checked={!formData.isPublished}
                onChange={() => setFormData(prev => ({ ...prev, isPublished: false, publishAt: '' }))}
                className="mt-1 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="font-medium text-gray-700">Save as draft</span>
                <p className="text-sm text-gray-500 mt-1">Your post will be saved but not published.</p>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="publishOption"
                checked={!!formData.publishAt}
                onChange={() => setFormData(prev => ({ ...prev, isPublished: true, publishAt: new Date().toISOString().slice(0, 16) }))}
                className="mt-1 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1">
                <span className="font-medium text-gray-700">Schedule publication</span>
                <div className="mt-2">
                  <input
                    type="datetime-local"
                    value={formData.publishAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, publishAt: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                    className="form-input"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">Your post will be published at the specified date and time.</p>
              </div>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1 relative overflow-hidden"
          >
            {loading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                {formData.publishAt ? 'Scheduling...' : formData.isPublished ? 'Publishing...' : 'Saving...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {formData.publishAt ? 'Schedule Post' : formData.isPublished ? 'Publish Post' : 'Save as Draft'}
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-outline flex-1"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>

          <button
            type="button"
            onClick={clearDraft}
            className="btn btn-ghost"
          >
            Clear Draft
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;