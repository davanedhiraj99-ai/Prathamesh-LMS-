import { useState, useEffect } from 'react';
import axios from '../../utils/axios-instance.js';

const ContentManager = ({ batches }) => {
  const [selectedBatch, setSelectedBatch] = useState('');
  const [activeTab, setActiveTab] = useState('videos');
  const [content, setContent] = useState({ videos: [], notes: [] });
  const [loading, setLoading] = useState(false);

  const [uploadType, setUploadType] = useState('video');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (selectedBatch) {
      fetchContent();
    }
  }, [selectedBatch]);

  const fetchContent = async () => {
    try {
      const response = await axios.get(`/admin/batch-content?batchId=${selectedBatch}`);
      setContent(response.data);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const handleVideoUpload = async (e) => {
    e.preventDefault();
    if (!title || !selectedFile || !selectedBatch) {
      alert('Please fill all fields and select a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const initResponse = await axios.post('/admin/bunny-upload', { title });
      const { videoId, libraryId } = initResponse.data;

      const uploadForm = new FormData();
      uploadForm.append('file', selectedFile);
      uploadForm.append('videoId', videoId);
      uploadForm.append('libraryId', libraryId);

      await axios.post('/admin/bunny-upload-file', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      await axios.post('/admin/upload-content', {
        title,
        type: 'video',
        batchId: selectedBatch,
        url: videoId,
        fileSize: selectedFile.size,
        thumbnail: `https://thumbnail.bunnycdn.com/${libraryId}/${videoId}.jpg`
      });

      alert('✅ Video uploaded successfully!');
      setTitle('');
      setSelectedFile(null);
      setUploadProgress(0);
      fetchContent();
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Failed to upload video: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleNoteUpload = async (e) => {
    e.preventDefault();
    if (!title || !selectedFile || !selectedBatch) {
      alert('Please fill all fields and select a PDF file');
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      alert('Please upload a PDF file only');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);
      formData.append('batchId', selectedBatch);

      const response = await axios.post('/admin/upload-note', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      alert('✅ Note uploaded successfully!');
      setTitle('');
      setSelectedFile(null);
      setUploadProgress(0);
      fetchContent();
    } catch (error) {
      console.error('Note upload error:', error);
      alert('❌ Failed to upload note');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (contentId) => {
    if (!confirm('Delete this content?')) return;
    
    try {
      await axios.delete(`/admin/batch-content?id=${contentId}`);
      fetchContent();
    } catch (error) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📚 Batch Content Manager</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Batch</label>
        <select 
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
        >
          <option value="">Choose a batch...</option>
          {batches.map(batch => (
            <option key={batch.id} value={batch.id}>{batch.name}</option>
          ))}
        </select>
      </div>

      {selectedBatch && (
        <>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                activeTab === 'videos' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'
              }`}
            >
              🎥 Videos ({content.videos?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                activeTab === 'notes' ? 'bg-white text-green-600 shadow' : 'text-gray-600'
              }`}
            >
              📄 Notes ({content.notes?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                activeTab === 'upload' ? 'bg-white text-purple-600 shadow' : 'text-gray-600'
              }`}
            >
              ⬆️ Upload New
            </button>
          </div>

          {activeTab === 'videos' && (
            <div className="space-y-3">
              {content.videos?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No videos uploaded yet</p>
              ) : (
                content.videos.map(video => (
                  <div key={video.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-24 h-16 object-cover rounded"
                        onError={(e) => e.target.src = '/assets/video-placeholder.jpg'}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{video.title}</h4>
                        <p className="text-sm text-gray-500">
                          {Math.round(video.file_size / 1024 / 1024)} MB • 
                          {new Date(video.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(video.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-3">
              {content.notes?.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No notes uploaded yet</p>
              ) : (
                content.notes.map(note => (
                  <div key={note.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-2xl">
                        📄
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{note.title}</h4>
                        <p className="text-sm text-gray-500">
                          {Math.round(note.file_size / 1024)} KB • 
                          {new Date(note.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <a 
                        href={note.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        👁️ View
                      </a>
                      <button 
                        onClick={() => handleDelete(note.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setUploadType('video')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 ${
                    uploadType === 'video' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  🎥 Upload Video
                </button>
                <button
                  onClick={() => setUploadType('note')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 ${
                    uploadType === 'note' 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  📄 Upload PDF Note
                </button>
              </div>

              {uploadType === 'video' && (
                <form onSubmit={handleVideoUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Video Title</label>
                    <input 
                      type="text"
                      required
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Lecture 1: Introduction to Physics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Video File</label>
                    <input 
                      type="file"
                      accept="video/*"
                      required
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="mt-1 w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">Supported: MP4, AVI, MOV, MKV</p>
                  </div>
                  
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Uploading to Bunny.net...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={uploading}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                      uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {uploading ? `Uploading... ${uploadProgress}%` : '🚀 Upload Video'}
                  </button>
                </form>
              )}

              {uploadType === 'note' && (
                <form onSubmit={handleNoteUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Note Title</label>
                    <input 
                      type="text"
                      required
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Chapter 1 Notes"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">PDF File</label>
                    <input 
                      type="file"
                      accept=".pdf"
                      required
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="mt-1 w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">PDF files only</p>
                  </div>
                  
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={uploading}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                      uploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {uploading ? `Uploading... ${uploadProgress}%` : '📤 Upload Note'}
                  </button>
                </form>
              )}
            </div>
          )}
        </>
      )}

      {!selectedBatch && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Select a batch to manage content</p>
        </div>
      )}
    </div>
  );
};

export default ContentManager;
