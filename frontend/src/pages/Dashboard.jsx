import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axios-instance.js';
import { useToast } from '../context/ToastContext.jsx';

const Dashboard = () => {
  const [enrolled, setEnrolled] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('my-courses');
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('/student/my-batches');
      setEnrolled(response.data.enrolled || []);
      setAvailable(response.data.available || []);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">Continue your learning with your enrolled batches.</p>
      </div>

      <div className="flex space-x-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm mb-6">
        <button
          onClick={() => setTab('my-courses')}
          className={`flex-1 rounded-lg py-2.5 px-4 text-sm font-semibold transition ${
            tab === 'my-courses'
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          My Courses ({enrolled.length})
        </button>
        <button
          onClick={() => setTab('new-courses')}
          className={`flex-1 rounded-lg py-2.5 px-4 text-sm font-semibold transition ${
            tab === 'new-courses'
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          New Courses ({available.length})
        </button>
      </div>

      {tab === 'my-courses' && (
        <div>
          {enrolled.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <p className="text-slate-600">No enrolled courses yet.</p>
              <button
                onClick={() => setTab('new-courses')}
                className="mt-3 text-sm font-semibold text-blue-700 hover:underline"
              >
                Browse new courses →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolled.map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="h-32 bg-gradient-to-r from-indigo-600 to-slate-900 flex items-center justify-center">
                    <span className="text-white text-sm font-bold tracking-wide uppercase">Enrolled</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-extrabold text-slate-900">{course.name}</h3>
                    <p className="text-slate-600 text-sm mt-2">
                      {course.description || 'No description'}
                    </p>
                    <div className="mt-4 flex justify-between text-xs font-semibold text-slate-500">
                      <span>{course.videos?.length || 0} videos</span>
                      <span>Enrolled: {new Date(course.enrolled_at).toLocaleDateString()}</span>
                    </div>
                    <Link
                      to={`/batch/${course.id}`}
                      className="mt-5 block w-full text-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-sm font-semibold transition"
                    >
                      Continue Learning
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'new-courses' && (
        <div>
          {available.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <p className="text-slate-600">No new courses available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {available.map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="h-32 bg-gradient-to-r from-slate-500 to-slate-800 flex items-center justify-center">
                    <span className="text-white text-sm font-bold tracking-wide uppercase">Available</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-extrabold text-slate-900">{course.name}</h3>
                    <p className="text-slate-600 text-sm mt-2">
                      {course.description || 'No description'}
                    </p>
                    <div className="mt-4 text-xs font-semibold text-slate-500">
                      <span>{course.video_count} videos available</span>
                    </div>
                    <button
                      onClick={() => showToast('Contact Prathamesh Sir to enroll in this course.', 'info')}
                      className="mt-5 block w-full text-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                    >
                      Request Enrollment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
