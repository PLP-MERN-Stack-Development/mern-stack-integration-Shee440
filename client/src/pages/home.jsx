import React, { useState, useEffect, useCallback } from 'react';
import PostCard from '../components/post/postcard.jsx';
import { postAPI, categoryAPI } from '../services/api';
import { useApi } from '../hooks/useAPi.js';

// Debounce hook for search input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Skeleton loader component
const PostCardSkeleton = () => (
  <div className="card post-card animate-pulse">
    <div className="h-48 bg-gray-300 rounded-t-lg"></div>
    <div className="p-6 space-y-4">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
      <div className="flex justify-between items-center pt-4">
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/6"></div>
      </div>
    </div>
  </div>
);

// Empty state illustration component
const EmptyState = ({ title, description, icon }) => (
  <div className="text-center py-16 fade-in">
    <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
      {icon || (
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )}
    </div>
    <h3 className="text-xl font-semibold text-gray-600 mb-2">{title}</h3>
    <p className="text-gray-500 max-w-md mx-auto">{description}</p>
  </div>
);

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [pagination, setPagination] = useState({});
  const { loading, error, callApi } = useApi();

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchPosts = useCallback(async (page = 1) => {
    const params = { 
      page, 
      limit: 9,
      category: selectedCategory || null
    };

    // Add sorting
    if (sortBy === 'popular') {
      params.sort = '-viewCount';
    } else if (sortBy === 'oldest') {
      params.sort = 'createdAt';
    } else {
      params.sort = '-createdAt'; // newest
    }

    const response = await callApi(postAPI.getPosts, params);
    if (response) {
      setPosts(response.data);
      setPagination(response.pagination || {});
    }
  }, [selectedCategory, sortBy, callApi]);

  const fetchCategories = async () => {
    const response = await callApi(categoryAPI.getCategories);
    if (response) {
      setCategories(response.data);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (debouncedSearchTerm.trim()) {
      const response = await callApi(postAPI.searchPosts, debouncedSearchTerm);
      if (response) {
        setPosts(response.data);
        setPagination({});
      }
    } else {
      fetchPosts(1);
    }
  };

  // Effect for debounced search
  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      handleSearch({ preventDefault: () => {} });
    }
  }, [debouncedSearchTerm]);

  // Effect for category and sort changes
  useEffect(() => {
    fetchPosts(1);
  }, [selectedCategory, sortBy, fetchPosts]);

  // Initial load
  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const handlePageChange = (page) => {
    fetchPosts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchTerm('');
    setSortBy('newest');
  };

  const hasActiveFilters = selectedCategory || searchTerm || sortBy !== 'newest';

  return (
    <div className="slide-in-left">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Latest Posts</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Discover amazing stories, insights, and knowledge from our community of writers
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="card mb-8">
        <div className="card-body">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search posts by title, content, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </form>

          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 flex-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`tag ${!selectedCategory ? 'bg-primary-500' : 'bg-gray-200 text-gray-700'}`}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category._id}
                  onClick={() => setSelectedCategory(category._id)}
                  className={`tag ${selectedCategory === category._id ? 'bg-primary-500' : 'bg-gray-200 text-gray-700'}`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Sort and Clear Filters */}
            <div className="flex gap-3 items-center">
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="form-select text-sm w-auto"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="popular">Most Popular</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="btn btn-ghost text-sm"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Indicator */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-primary-700">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                  <span>Filters Active</span>
                </div>
                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                  {posts.length} results
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      {loading && posts.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <PostCardSkeleton key={index} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No posts found" : "No posts yet"}
          description={
            hasActiveFilters 
              ? "Try adjusting your filters or search terms to find what you're looking for."
              : "Be the first to create a post and share your knowledge with the community!"
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {posts.map(post => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>

          {/* Enhanced Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
              {/* Page Info */}
              <div className="text-sm text-gray-600">
                Showing page {pagination.page} of {pagination.pages} • {pagination.total} total posts
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn btn-outline px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`btn ${pagination.page === pageNum ? 'btn-primary' : 'btn-ghost'} px-3 py-2 min-w-[2.5rem]`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="btn btn-outline px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;