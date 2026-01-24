import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import useAuthStore from './context/auth.store';
import { ThemeContextProvider } from './context/theme.context';
import AdminCourses from './pages/admin/Courses';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import CoursePage from './pages/Course';
import Courses from './pages/Courses';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Messages from './pages/Messages';
import Profile from './pages/Profile';

function App() {
  const { token, user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  if (!token) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <ThemeContextProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {isAdmin ? (
              <>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/students" element={<AdminStudents />} />
                <Route path="/courses" element={<AdminCourses />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/courses/:id" element={<CoursePage />} />
                <Route path="/profile" element={<Profile />} />
              </>
            )}
            
            <Route path="/messages" element={<Messages />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeContextProvider>
  );
}

export default App;