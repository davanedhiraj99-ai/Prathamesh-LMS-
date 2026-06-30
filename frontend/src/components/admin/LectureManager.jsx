import { useState, useEffect } from 'react';
import axios from '../../utils/axios-instance.js';
import SecurePlayer from '../player/SecurePlayer.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const LectureManager = ({ batches }) => {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [content, setContent] = useState({ videos: [], notes: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const { showToast } = useToast();

  useEffect(() => {
    if (selectedBatch) {
      fetchContent();
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (!selectedBatch) {
      return undefined;
    }

    const hasPendingVideos = (content.videos || []).some(
      (video) => video.status === 'uploading' || video.status === 'processing'
    );

    if (!hasPendingVideos) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      fetchContent();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [selectedBatch, content.videos]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/admin/batch-content?batchId=${selectedBatch}`);
      setContent(response.data);
      if (response.data.videos?.length > 0 && !selectedVideo) {
        setSelectedVideo(response.data.videos[0]);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      showToast('Failed to load content.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contentId, type) => {
    if (!confirm(`Delete this ${type}? This action cannot be undone.`)) return;
    try {
      await axios.delete(`/admin/batch-content?id=${contentId}`);
      showToast(`${type} deleted successfully.`, 'success');
      fetchContent();
      if (selectedVideo?.id === contentId) {
        setSelectedVideo(null);
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to delete content.', 'error');
    }
  };

  const handleEdit = (item) => {
    setEditingContent(item);
    setEditForm({
      title: item.title,
      description: item.description || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/admin/batch-content?id=${editingContent.id}`, {
        title: editForm.title,
        description: editForm.description
      });
      showToast('Content updated successfully.', 'success');
      setEditingContent(null);
      fetchContent();
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to update content.', 'error');
    }
  };

  const handlePreview = (video) => {
    setSelectedVideo(video);
    setActiveTab('preview');
  };

  const getStatusBadge = (status) => {
    const styles = {
      'uploading': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'ready': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    };
    const icons = {
      'uploading': '⏳',
      'processing': '⚙️',
      'ready': '✅',
      'failed': '❌'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {icons[status]} {status?.toUpperCase()}
      </span>
    );
  };

  const selectedBatchData = batches.find(b => b.id.toString() === selectedBatch);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Lecture Manager</h2>
        <p className="text-gray-600">View, preview, and manage all uploaded content</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Batch/Course</label>
        <select 
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          value={selectedBatch}
          onChange={(e) => {
            setSelectedBatch(e.target.value);
            setSelectedVideo(null);
          }}
        >
          <option value="">Choose a batch...</option>
          {batches.map(batch => (
            <option key={batch.id} value={batch.id}>{batch.name}</option>
          ))}
        </select>
      </div>

      {selectedBatch && (
        <>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-blue-900">{selectedBatchData?.name}</h3>
                <p className="text-sm text-blue-700 mt-1">{selectedBatchData?.description || 'No description'}</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-blue-600">{content.videos?.length || 0} Videos</span>
                <span className="mx-2 text-blue-400">•</span>
                <span className="text-sm text-blue-600">{content.notes?.length || 0} Notes</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'videos' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              Videos ({content.videos?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'notes' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              Notes ({content.notes?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              disabled={!selectedVideo}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === 'preview' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'}`}
            >
              Preview
            </button>
          </div>

          {activeTab === 'videos' && (
            <div className="space-y-4">
              {content.videos?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-lg">No videos uploaded yet</p>
                  <p className="text-gray-400 text-sm mt-2">Upload videos from the Upload Content tab</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {content.videos.map((video, index) => (
                    <div key={video.id} className={`border rounded-lg p-4 transition-all ${selectedVideo?.id === video.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-start space-x-4">
                        <div className="relative flex-shrink-0">
                          <img 
                            src={video.thumbnail || '/assets/video-placeholder.jpg'}
                            alt={video.title}
                            className="w-32 h-20 object-cover rounded-lg"
                            onError={(e) => e.target.src = '/assets/video-placeholder.jpg'}
                          />
                          <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">#{index + 1}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-900 truncate">{video.title}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {Math.round(video.file_size / 1024 / 1024)} MB • {new Date(video.created_at).toLocaleDateString()}
                              </p>
                              <div className="mt-2">{getStatusBadge(video.status)}</div>
                            </div>
                            <div className="flex space-x-2">
                              <button onClick={() => handlePreview(video)} className="text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-md text-sm transition">Preview</button>
                              <button onClick={() => handleEdit(video)} className="text-yellow-600 hover:text-yellow-800 bg-yellow-50 px-3 py-1 rounded-md text-sm transition">Edit</button>
                              <button onClick={() => handleDelete(video.id, 'video')} className="text-red-600 hover:text-red-800 bg-red-50 px-3 py-1 rounded-md text-sm transition">Delete</button>
                            </div>
                          </div>
                          {video.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{video.description}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {content.notes?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-lg">No notes uploaded yet</p>
                  <p className="text-gray-400 text-sm mt-2">Upload PDF notes from the Upload Content tab</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {content.notes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">📄</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{note.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{Math.round(note.file_size / 1024)} KB • {new Date(note.created_at).toLocaleDateString()}</p>
                          <div className="flex space-x-2 mt-3">
                            <a href={note.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-md text-sm transition">Download</a>
                            <button onClick={() => handleEdit(note)} className="text-yellow-600 hover:text-yellow-800 bg-yellow-50 px-3 py-1 rounded-md text-sm transition">Edit</button>
                            <button onClick={() => handleDelete(note.id, 'note')} className="text-red-600 hover:text-red-800 bg-red-50 px-3 py-1 rounded-md text-sm transition">Delete</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && selectedVideo && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-purple-900">Admin Preview Mode</h3>
                <p className="text-sm text-purple-700 mt-1">This is how students will see the video with secure streaming.</p>
              </div>
              <SecurePlayer bunnyVideoId={selectedVideo.url} title={selectedVideo.title} />
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Video Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Title:</span><p className="text-gray-900">{selectedVideo.title}</p></div>
                  <div><span className="text-gray-500">Status:</span><p className="mt-1">{getStatusBadge(selectedVideo.status)}</p></div>
                  <div><span className="text-gray-500">File Size:</span><p className="text-gray-900">{Math.round(selectedVideo.file_size / 1024 / 1024)} MB</p></div>
                  <div><span className="text-gray-500">Uploaded:</span><p className="text-gray-900">{new Date(selectedVideo.created_at).toLocaleString()}</p></div>
                  <div><span className="text-gray-500">Video ID:</span><p className="text-gray-900 font-mono text-xs">{selectedVideo.url}</p></div>
                  <div><span className="text-gray-500">Duration:</span><p className="text-gray-900">{selectedVideo.duration ? `${Math.floor(selectedVideo.duration / 60)}:${(selectedVideo.duration % 60).toString().padStart(2, '0')}` : 'Unknown'}</p></div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!selectedBatch && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">Select a batch to view and manage lectures</p>
        </div>
      )}

      {editingContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Edit Content</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input type="text" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-3 py-2" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-3 py-2" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} placeholder="Optional description..." />
              </div>
              <div className="flex space-x-4 pt-4">
                <button type="button" onClick={() => setEditingContent(null)} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-md transition">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LectureManager;
