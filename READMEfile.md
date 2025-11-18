# MERN Stack Blog Application

A full-stack blog application built with the MERN (MongoDB, Express.js, React, Node.js) stack. This application allows users to create, read, update, and delete blog posts with features like authentication, categories, comments, and image uploads.

## 🚀 Features

### User Features
- **User Authentication**: Secure registration and login with JWT tokens
- **User Roles**: Support for regular users and admin roles
- **Profile Management**: User profiles with username and email

### Blog Features
- **Create Posts**: Rich text blog post creation with featured images
- **Edit Posts**: Update existing posts with full editing capabilities
- **Delete Posts**: Remove posts (author or admin only)
- **View Posts**: Beautiful post detail pages with comments
- **Search**: Search posts by title, content, or tags
- **Categories**: Organize posts by categories
- **Tags**: Add tags to posts for better discoverability
- **Comments**: Add comments to posts (authenticated users)
- **Pagination**: Browse posts with pagination support
- **Draft System**: Save posts as drafts or publish immediately

### UI/UX Features
- **Modern Design**: Clean and responsive UI with CSS variables
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Form Validation**: Real-time form validation
- **Image Upload**: Featured image upload with preview
- **Password Visibility**: Toggle password visibility in forms

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0**: UI library
- **React Router DOM 6.8.0**: Client-side routing
- **Vite 7.2.2**: Build tool and dev server
- **Axios 1.6.2**: HTTP client for API requests
- **CSS3**: Modern styling with CSS variables and animations

### Backend
- **Node.js**: JavaScript runtime
- **Express.js 4.18.2**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose 8.0.3**: MongoDB object modeling
- **JWT (jsonwebtoken 9.0.2)**: Authentication tokens
- **bcryptjs 2.4.3**: Password hashing
- **Multer 1.4.5**: File upload handling
- **express-validator 7.0.1**: Input validation
- **CORS 2.8.5**: Cross-origin resource sharing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)

## 🔧 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mern-stack-integration
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mern-blog
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mern-blog

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here
```

### Frontend Environment Variables (Optional)

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Running the Application

### Development Mode

#### Start Backend Server

```bash
cd server
npm start
# or for development with auto-reload:
npm run dev
```

The backend server will run on `http://localhost:5000`

#### Start Frontend Server

```bash
cd client
npm run dev
```

The frontend server will run on `http://localhost:5173` (or next available port)

### Production Build

#### Build Frontend

```bash
cd client
npm run build
```

The production build will be in the `client/dist` directory.

## 📁 Project Structure

```
mern-stack-integration/
│
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   │   ├── layout/    # Layout components (Header, Layout)
│   │   │   └── post/      # Post-related components
│   │   ├── context/       # React Context (Auth context)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   │   ├── home.jsx
│   │   │   ├── login.jsx
│   │   │   ├── register.jsx
│   │   │   ├── createpost.jsx
│   │   │   ├── editpost.jsx
│   │   │   └── postdetail.jsx
│   │   ├── services/      # API service layer
│   │   ├── app.jsx        # Main App component
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── index.html
│   └── package.json
│
├── server/                # Backend Express Application
│   ├── config/            # Configuration files
│   │   └── db.js          # MongoDB connection
│   ├── controllers/       # Route controllers
│   │   ├── authcontroller.js
│   │   ├── postcontroller.js
│   │   ├── categorycontroller.js
│   │   └── commentcontroller.js
│   ├── middleware/        # Express middleware
│   │   ├── auth.js        # JWT authentication
│   │   └── errorhandler.js
│   ├── models/            # Mongoose models
│   │   ├── user.js
│   │   ├── post.js
│   │   ├── category.js
│   │   └── comment.js
│   ├── routes/            # API routes
│   │   ├── authroutes.js
│   │   ├── postroutes.js
│   │   ├── categoryroutes.js
│   │   └── commentroutes.js
│   ├── utils/             # Utility functions
│   │   └── upload.js      # Multer configuration
│   ├── uploads/           # Uploaded images (created automatically)
│   ├── server.js          # Express app entry point
│   └── package.json
│
└── READMEfile.md
```

### Query Parameters

**Get Posts:**
- `page`: Page number (default: 1)
- `limit`: Posts per page (default: 10)
- `category`: Filter by category ID
- `search`: Search term

## 📝 Usage Examples

### Register a New User

```javascript
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login

```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Create a Post

```javascript
POST /api/posts
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "My First Post",
  "content": "This is the content...",
  "category": "category_id_here",
  "tags": "react, javascript",
  "excerpt": "Short description",
  "isPublished": "true",
  "featuredImage": <file>
}
```

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication. After successful login, the token is stored in localStorage and automatically included in API requests.

**Token Format:**
```
Authorization: Bearer <jwt_token>
```

**Token Expiration:** 30 days

## 🗄️ Database Schema

### User Model
- `username`: String (unique, required)
- `email`: String (unique, required)
- `password`: String (hashed, required)
- `role`: String (enum: 'user', 'admin', default: 'user')
- `timestamps`: createdAt, updatedAt

### Post Model
- `title`: String (required, max 100 chars)
- `content`: String (required)
- `slug`: String (unique, auto-generated)
- `excerpt`: String (max 200 chars)
- `author`: ObjectId (ref: User)
- `category`: ObjectId (ref: Category)
- `tags`: [String]
- `featuredImage`: String
- `isPublished`: Boolean (default: false)
- `viewCount`: Number (default: 0)
- `comments`: [Comment]
- `timestamps`: createdAt, updatedAt

### Category Model
- `name`: String (unique, required)
- `description`: String
- `timestamps`: createdAt, updatedAt

## 🎨 Frontend Features

### Pages
- **Home**: Browse all posts with search and category filters
- **Login**: User authentication
- **Register**: New user registration
- **Create Post**: Create new blog posts
- **Edit Post**: Edit existing posts
- **Post Detail**: View post with comments

### Components
- **Header**: Navigation bar with auth status
- **Layout**: Main layout wrapper
- **PostCard**: Post preview card component

### Custom Hooks
- **useApi**: Custom hook for API calls with loading/error states
- **useAuth**: Context hook for authentication state

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or MongoDB service is active
- Check connection string in `.env` file
- Verify MongoDB port (default: 27017)

### Port Already in Use
- Backend: Change `PORT` in `.env` file
- Frontend: Vite will automatically try next available port

### CORS Errors
- Ensure backend CORS is configured correctly
- Check that frontend URL is allowed in CORS settings

### Image Upload Issues
- Ensure `server/uploads` directory exists
- Check file size limits (default: 5MB)
- Verify file types are allowed (images only)

## 📦 Dependencies

### Backend Dependencies
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `jsonwebtoken`: JWT authentication
- `bcryptjs`: Password hashing
- `multer`: File uploads
- `express-validator`: Input validation
- `cors`: CORS middleware
- `dotenv`: Environment variables

### Frontend Dependencies
- `react`: UI library
- `react-dom`: React DOM renderer
- `react-router-dom`: Routing
- `axios`: HTTP client
- `vite`: Build tool

## 🚧 Future Enhancements

- [ ] Rich text editor (WYSIWYG)
- [ ] Markdown support
- [ ] User profiles with avatars
- [ ] Post likes/favorites
- [ ] Email notifications
- [ ] Password reset functionality
- [ ] Social media sharing
- [ ] SEO optimization
- [ ] Admin dashboard
- [ ] Analytics and statistics
- [ ] Dark mode toggle
- [ ] Multi-language support

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

Sheila Mumbi

**Built with ❤️ using the MERN Stack**

