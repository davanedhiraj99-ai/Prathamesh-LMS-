import { useCallback, useEffect, useState } from 'react';
import axios from '../../utils/axios-instance.js';

const BatchCreator = ({ onBatchCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [batches, setBatches] = useState([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  const fetchBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const response = await axios.get('/admin/batches');
      setBatches(response.data || []);
      setMessage('');
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to load batches';
      setMessage(`ERROR: ${errorMsg}`);
    } finally {
      setLoadingBatches(false);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage('ERROR: Please enter a batch name');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await axios.post('/admin/batches', {
        name: name.trim(),
        description: description.trim()
      });

      setName('');
      setDescription('');
      setMessage(`SUCCESS: Batch "${response.data?.name || 'New batch'}" created successfully!`);
      await fetchBatches();
      onBatchCreated?.();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      setMessage(`ERROR: Failed to create batch: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;

    try {
      await axios.delete(`/admin/batches?id=${Number(id)}`);
      setMessage('SUCCESS: Batch deleted');
      fetchBatches();
    } catch {
      setMessage('ERROR: Failed to delete');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Batch</h2>

        {message && (
          <div
            className={`mb-4 p-3 rounded-md ${
              message.startsWith('SUCCESS:') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Batch Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., JEE Physics 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows="3"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this batch..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`w-full py-2 px-4 rounded-md text-white font-medium transition ${
              saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {saving ? 'Creating...' : 'Create Batch'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Active Batches</h2>
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">{batches.length} total</span>
        </div>

        {loadingBatches ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading batches...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">No batches created yet</p>
            <p className="text-gray-400 text-sm mt-2">Create your first batch using the form</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {batches.map((batch) => (
              <div key={batch.id} className="border rounded-lg p-4 hover:shadow-md transition bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">#{batch.id}</span>
                      <h3 className="font-semibold text-gray-900">{batch.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{batch.description || 'No description'}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Created: {batch.created_at ? new Date(batch.created_at).toLocaleString() : '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(batch.id)}
                    className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchCreator;
