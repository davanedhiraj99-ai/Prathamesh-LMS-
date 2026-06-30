import { useEffect, useState } from 'react';
import axios from '../utils/axios-instance.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../context/ToastContext.jsx';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/student/profile');
        const nextProfile = response.data || null;
        setProfile(nextProfile);
        setName(nextProfile?.name || '');
        setError('');
      } catch (err) {
        const message = err.response?.data?.error || err.message || 'Failed to load profile';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    try {
      setSaving(true);
      const response = await axios.put('/student/profile', { name: name.trim() });
      const nextProfile = {
        ...(profile || {}),
        ...(response.data || {})
      };
      setProfile(nextProfile);
      updateUser({
        ...(user || {}),
        name: nextProfile.name,
        email: nextProfile.email,
        role: nextProfile.role
      });
      setError('');
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to update profile';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          Student Profile
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">Manage your account</h1>
        <p className="mt-2 text-slate-600">
          Keep your student details accurate so your learning portal stays up to date.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-900">Profile details</h2>
            <p className="mt-1 text-sm text-slate-500">Update the information visible inside your student account.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                placeholder="Enter your full name"
                maxLength={255}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 shadow-sm"
              />
              <p className="mt-2 text-xs text-slate-500">Email changes are locked from the student side for security.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`mt-6 inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition ${
              saving ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving changes...' : 'Save profile'}
          </button>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-900">Account summary</h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Role</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{profile?.role || 'student'}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Joined</p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
              Your profile name updates immediately across the student portal after saving.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
