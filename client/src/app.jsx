import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/auth.context.jsx';
import Layout from './components/layout/layout.jsx';
import Home from './pages/home.jsx';
import Login from './pages/login.jsx';
import Register from './pages/register.jsx';
import CreatePost from './pages/createpost.jsx';
import PostDetail from './pages/postdetail.jsx';
import EditPost from './pages/editpost.jsx';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/posts/:id" element={<PostDetail />} />
            <Route path="/edit-post/:id" element={<EditPost />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;