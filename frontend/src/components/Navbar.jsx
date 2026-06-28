import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from '../utils/axios-instance.js';
import { clearAuthSession } from '../utils/auth-session.js';
import { useMediaQuery } from '../hooks/useMediaQuery.js';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCoursesOpen, setIsMobileCoursesOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    fetchCourses();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDesktop) setIsMobileMenuOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (!isMobileMenuOpen) setIsMobileCoursesOpen(false);
  }, [isMobileMenuOpen]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/public/batches');
      setCourses(response.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }

    clearAuthSession();
    setUser(null);
    navigate('/login');
  };

  const handleCourseClick = (courseId) => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileCoursesOpen(false);
    navigate(`/course/${courseId}`);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 text-slate-900 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-lg font-extrabold tracking-tight hover:opacity-90 transition">
              Prathamesh Sir's LMS
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              Menu
            </button>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition">
                Home
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  className="flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900 transition focus:outline-none"
                >
                  <span>Courses</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-2xl z-50"
                    onMouseLeave={() => setIsDropdownOpen(false)}
                  >
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-700">Available Courses</p>
                      </div>

                      {loading ? (
                        <div className="px-4 py-3 text-sm text-slate-500">Loading...</div>
                      ) : courses.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-500">No courses available</p>
                      ) : (
                        <div className="max-h-72 overflow-y-auto">
                          {courses.map((course) => (
                            <button
                              key={course.id}
                              onClick={() => handleCourseClick(course.id)}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition flex items-center justify-between"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {course.name}
                                </p>
                                <p className="text-xs text-slate-500">{course.video_count} videos</p>
                              </div>
                              <span className="text-slate-400">›</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/testimonials" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition">
                Testimonials
              </Link>

              <Link to="/contact" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition">
                Contact
              </Link>

              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition">
                      Admin Panel
                    </Link>
                  )}
                  {user.role === 'student' && (
                    <Link to="/dashboard" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition">
                      Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              Home
            </Link>
            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setIsMobileCoursesOpen((v) => !v)}
                className="w-full px-3 py-2 text-left text-sm font-semibold text-slate-800 flex items-center justify-between"
              >
                <span>Courses</span>
                <span className="text-slate-500">{isMobileCoursesOpen ? '–' : '+'}</span>
              </button>
              {isMobileCoursesOpen && (
                <div className="border-t border-slate-200">
                  {loading ? (
                    <div className="px-3 py-2 text-sm text-slate-500">Loading...</div>
                  ) : courses.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500">No courses available</div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto py-1">
                      {courses.map((course) => (
                        <button
                          key={course.id}
                          onClick={() => handleCourseClick(course.id)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 transition"
                        >
                          <p className="text-sm font-semibold text-slate-900 truncate">{course.name}</p>
                          <p className="text-xs text-slate-500">{course.video_count} videos</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Link to="/testimonials" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              Testimonials
            </Link>
            <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              Contact
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Admin Panel
              </Link>
            )}
            {user?.role === 'student' && (
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Dashboard
              </Link>
            )}
            <div className="pt-2">
              {user ? (
                <button onClick={handleLogout} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                  Logout
                </button>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
