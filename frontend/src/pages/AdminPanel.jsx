import { useEffect, useState } from 'react';
import StudentTable from '../components/admin/StudentTable.jsx';
import BatchCreator from '../components/admin/BatchCreator.jsx';
import BatchAllocator from '../components/admin/BatchAllocator.jsx';
import ContentManager from '../components/admin/ContentManager.jsx';
import LectureManager from '../components/admin/LectureManager.jsx';
import axios from '../utils/axios-instance.js';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalBatches: 0,
    totalEnrollments: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [batchesRes, statsRes] = await Promise.all([axios.get('/admin/batches'), axios.get('/admin/stats')]);
      setBatches(batchesRes.data || []);
      setStats(statsRes.data || stats);
    } catch {
      // keep UI clean
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'students':
        return <StudentTable onDataChange={fetchData} />;
      case 'batches':
        return <BatchCreator onBatchCreated={fetchData} />;
      case 'allocate':
        return <BatchAllocator />;
      case 'upload':
        return <ContentManager batches={batches} />;
      case 'lectures':
        return <LectureManager batches={batches} />;
      default:
        return <StudentTable onDataChange={fetchData} />;
    }
  };

  const tabs = [
    { id: 'students', label: 'Students' },
    { id: 'batches', label: 'Batches' },
    { id: 'allocate', label: 'Batch Allocation' },
    { id: 'upload', label: 'Upload Content' },
    { id: 'lectures', label: 'Lectures' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          Admin Area
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">Admin Panel</h1>
        <p className="mt-2 text-slate-600">
          Manage students, batches, and content in a secure environment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Students', value: stats.totalStudents },
          { label: 'Total Batches', value: stats.totalBatches },
          { label: 'Total Enrollments', value: stats.totalEnrollments }
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-600">{card.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === t.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>{renderContent()}</div>
    </div>
  );
};

export default AdminPanel;
