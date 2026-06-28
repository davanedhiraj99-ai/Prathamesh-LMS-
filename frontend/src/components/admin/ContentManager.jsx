import { useEffect, useState } from 'react';
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
  const [placement, setPlacement] = useState('last');
  const [positionNumber, setPositionNumber] = useState('');

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
    if (!selectedBatch) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/admin/batch-content?batchId=${selectedBatch}`);
      setContent(response.data);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetUploadForm = () => {
    setTitle('');
    setSelectedFile(null);
    setUploadProgress(0);
    setPlacement('last');
    setPositionNumber('');
  };

  const handleVideoUpload = async (event) => {
    event.preventDefault();
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
        thumbnail: `https://thumbnail.bunnycdn.com/${libraryId}/${videoId}.jpg`,
        placement,
        positionNumber: placement === 'number' ? positionNumber : null
      });

      alert('Video uploaded successfully.');
      resetUploadForm();
      setActiveTab('videos');
      await fetchContent();
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload video: ${error.response?.data?.error || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleNoteUpload = async (event) => {
    event.preventDefault();
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
      formData.append('placement', placement);

      if (placement === 'number') {
        formData.append('positionNumber', positionNumber);
      }

      await axios.post('/admin/upload-note', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (!progressEvent.total) return;
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      alert('Note uploaded successfully.');
      resetUploadForm();
      setActiveTab('notes');
      await fetchContent();
    } catch (error) {
      console.error('Note upload error:', error);
      alert(`Failed to upload note: ${error.response?.data?.error || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (contentId) => {
    if (!confirm('Delete this content?')) return;

    try {
      await axios.delete(`/admin/batch-content?id=${contentId}`);
      await fetchContent();
    } catch (error) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Batch Content Manager</h2>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">Select Batch</label>
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          value={selectedBatch}
          onChange={(event) => setSelectedBatch(event.target.value)}
        >
          <option value="">Choose a batch...</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>
      </div>

      {selectedBatch && (
        <>
          <div className="mb-6 flex space-x-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${
                activeTab === 'videos' ? 'bg-white text-blue-600 shadow' : 'text-gray-600'
              }`}
            >
              Videos ({content.videos?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${
                activeTab === 'notes' ? 'bg-white text-green-600 shadow' : 'text-gray-600'
              }`}
            >
              Notes ({content.notes?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium ${
                activeTab === 'upload' ? 'bg-white text-purple-600 shadow' : 'text-gray-600'
              }`}
            >
              Upload New
            </button>
          </div>

          {activeTab === 'videos' && (
            <div className="space-y-3">
              {loading ? (
                <p className="py-8 text-center text-gray-500">Refreshing content...</p>
              ) : content.videos?.length === 0 ? (
                <p className="py-8 text-center text-gray-500">No videos uploaded yet</p>
              ) : (
                content.videos.map((video) => (
                  <div key={video.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="h-16 w-24 rounded object-cover"
                        onError={(event) => {
                          event.target.src = '/assets/video-placeholder.jpg';
                        }}
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{video.title}</h4>
                        <p className="text-sm text-gray-500">
                          {Math.round(video.file_size / 1024 / 1024)} MB •{' '}
                          {new Date(video.created_at).toLocaleDateString()}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Status: {video.status || 'uploading'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(video.id)} className="text-red-600 hover:text-red-800">
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-3">
              {loading ? (
                <p className="py-8 text-center text-gray-500">Refreshing content...</p>
              ) : content.notes?.length === 0 ? (
                <p className="py-8 text-center text-gray-500">No notes uploaded yet</p>
              ) : (
                content.notes.map((note) => (
                  <div key={note.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-2xl">
                        PDF
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{note.title}</h4>
                        <p className="text-sm text-gray-500">
                          {Math.round(note.file_size / 1024)} KB • {new Date(note.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(note.id)} className="text-red-600 hover:text-red-800">
                      Delete
                    </button>
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
                  className={`flex-1 rounded-lg border-2 px-4 py-3 ${
                    uploadType === 'video'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  Upload Video
                </button>
                <button
                  onClick={() => setUploadType('note')}
                  className={`flex-1 rounded-lg border-2 px-4 py-3 ${
                    uploadType === 'note'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  Upload PDF Note
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
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g., Lecture 1: Introduction to Physics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Video File</label>
                    <input
                      type="file"
                      accept="video/*"
                      required
                      onChange={(event) => setSelectedFile(event.target.files[0])}
                      className="mt-1 w-full"
                    />
                    <p className="mt-1 text-xs text-gray-500">Supported: MP4, AVI, MOV, MKV</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label className="block text-sm font-medium text-gray-700">Lecture Position</label>
                    <select
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
                      value={placement}
                      onChange={(event) => setPlacement(event.target.value)}
                    >
                      <option value="last">Place at the end</option>
                      <option value="first">Place at the beginning</option>
                      <option value="number">Enter a lecture number</option>
                    </select>
                    {placement === 'number' && (
                      <input
                        type="number"
                        min="1"
                        value={positionNumber}
                        onChange={(event) => setPositionNumber(event.target.value)}
                        className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="e.g., 2"
                        required
                      />
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      Re-uploaded lectures can now be inserted at the first, last, or any custom lecture slot.
                    </p>
                  </div>

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Uploading to Bunny.net...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2.5 rounded-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading}
                    className={`w-full rounded-md px-4 py-2 font-medium text-white ${
                      uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Video'}
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
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g., Chapter 1 Notes"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">PDF File</label>
                    <input
                      type="file"
                      accept=".pdf"
                      required
                      onChange={(event) => setSelectedFile(event.target.files[0])}
                      className="mt-1 w-full"
                    />
                    <p className="mt-1 text-xs text-gray-500">PDF files only</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <label className="block text-sm font-medium text-gray-700">Note Position</label>
                    <select
                      className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2"
                      value={placement}
                      onChange={(event) => setPlacement(event.target.value)}
                    >
                      <option value="last">Place at the end</option>
                      <option value="first">Place at the beginning</option>
                      <option value="number">Enter a note number</option>
                    </select>
                    {placement === 'number' && (
                      <input
                        type="number"
                        min="1"
                        value={positionNumber}
                        onChange={(event) => setPositionNumber(event.target.value)}
                        className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2"
                        placeholder="e.g., 2"
                        required
                      />
                    )}
                  </div>

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2.5 rounded-full bg-green-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading}
                    className={`w-full rounded-md px-4 py-2 font-medium text-white ${
                      uploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Note'}
                  </button>
                </form>
              )}
            </div>
          )}
        </>
      )}

      {!selectedBatch && (
        <div className="rounded-lg bg-gray-50 py-12 text-center">
          <p className="text-gray-500">Select a batch to manage content</p>
        </div>
      )}
    </div>
  );
};

export default ContentManager;
