import React from 'react';
import { Link } from 'react-router-dom';

const PostCard = ({ post }) => {
  // CSS variables for consistent theming
  const cardStyle = {
    '--primary-color': '#2563eb',
    '--primary-hover': '#1d4ed8',
    '--text-primary': '#1f2937',
    '--text-secondary': '#6b7280',
    '--text-light': '#9ca3af',
    '--bg-card': '#ffffff',
    '--shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '--shadow-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '--transition': 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate reading time (assuming average reading speed of 200 words per minute)
  const calculateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content?.split(/\s+/).length || 0;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime < 1 ? 1 : readingTime;
  };

  // Use excerpt if available, otherwise create one from content
  const getExcerpt = () => {
    if (post.excerpt) return post.excerpt;
    
    // Create excerpt from content (first 150 characters)
    if (post.content) {
      return post.content.length > 150 
        ? `${post.content.substring(0, 150)}...` 
        : post.content;
    }
    
    return 'No content available';
  };

  const readingTime = calculateReadingTime(post.content);

  return (
    <div 
      className="post-card bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow)] overflow-hidden hover:shadow-[var(--shadow-hover)] transition-[var(--transition)] transform hover:-translate-y-1 border border-gray-100"
      style={cardStyle}
    >
      {post.featuredImage && (
        <div className="relative overflow-hidden">
          <img 
            src={`http://localhost:5000${post.featuredImage}`} 
            alt={post.title}
            className="w-full h-48 object-cover transition-[var(--transition)] hover:scale-105"
          />
          {/* Reading time badge */}
          <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {readingTime} min read
          </div>
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--primary-color)] font-semibold bg-blue-50 px-2 py-1 rounded-full">
              {post.category?.name}
            </span>
            {/* Like/comment counts */}
            {(post.likeCount > 0 || post.commentCount > 0) && (
              <div className="flex items-center gap-3 text-xs text-[var(--text-light)]">
                {post.likeCount > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
                    </svg>
                    {post.likeCount}
                  </span>
                )}
                {post.commentCount > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                    </svg>
                    {post.commentCount}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <span className="text-sm text-[var(--text-light)]">
            {formatDate(post.createdAt)}
          </span>
        </div>
        
        <h2 className="text-xl font-bold mb-3 line-clamp-2 group">
          <Link 
            to={`/posts/${post._id}`} 
            className="text-[var(--text-primary)] hover:text-[var(--primary-color)] transition-[var(--transition)] group-hover:underline decoration-2 underline-offset-2"
          >
            {post.title}
          </Link>
        </h2>
        
        <p className="text-[var(--text-secondary)] mb-4 line-clamp-3 leading-relaxed">
          {getExcerpt()}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {post.author?.avatar && (
              <img 
                src={`http://localhost:5000${post.author.avatar}`} 
                alt={post.author.username}
                className="w-6 h-6 rounded-full object-cover"
              />
            )}
            <span className="text-sm text-[var(--text-secondary)]">
              By {post.author?.username}
            </span>
          </div>
          
          <Link 
            to={`/posts/${post._id}`}
            className="text-[var(--primary-color)] hover:text-[var(--primary-hover)] font-medium transition-[var(--transition)] flex items-center gap-1 group"
          >
            Read More
            <svg 
              className="w-4 h-4 transition-transform group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PostCard;