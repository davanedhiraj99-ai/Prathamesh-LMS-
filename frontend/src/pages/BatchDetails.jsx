import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SecurePlayer from '../components/player/SecurePlayer.jsx';
import axios from '../utils/axios-instance.js';

const BatchDetails = () => {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [content, setContent] = useState({ videos: [], notes: [] });
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('videos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatchDetails();
  }, [batchId]);

  const fetchBatchDetails = async () => {
    try {
      const [batchResponse, contentResponse] = await Promise.all([
        axios.get('/student/my-batches'),
        axios.get(`/student/batch-content?batchId=${batchId}`)
      ]);

      const foundBatch = batchResponse.data.enrolled?.find((b) => String(b.id) === String(batchId));
      setBatch(foundBatch || null);
      setContent(contentResponse.data || { videos: [], notes: [] });

      if (contentResponse.data?.videos?.length > 0) {
        setSelectedVideo(contentResponse.data.videos[0]);
      } else {
        setSelectedVideo(null);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
        <p className="text-red-600">Batch not found or access denied.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{batch.name}</h1>
        <p className="mt-2 text-slate-600">{batch.description}</p>
      </div>

      <div className="flex space-x-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm mb-6">
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex-1 rounded-lg py-2.5 px-4 text-sm font-semibold transition ${
            activeTab === 'videos'
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          Videos ({content.videos?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 rounded-lg py-2.5 px-4 text-sm font-semibold transition ${
            activeTab === 'notes'
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          Notes ({content.notes?.length || 0})
        </button>
      </div>

      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {selectedVideo ? (
              <SecurePlayer bunnyVideoId={selectedVideo.url} title={selectedVideo.title} />
            ) : (
              <div className="aspect-video rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center">
                <p className="text-slate-600">No videos available</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900">Lecture List</h3>
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                {(content.videos || []).map((video, index) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition flex items-start gap-3 ${
                      selectedVideo?.id === video.id ? 'bg-slate-50' : ''
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-700 text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{video.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {video.file_size ? `${Math.round(video.file_size / 1024 / 1024)} MB` : '—'}
                      </p>
                    </div>
                  </button>
                ))}
                {(content.videos || []).length === 0 && (
                  <div className="p-6 text-sm text-slate-600">No lectures uploaded yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900">Notes</h3>
          </div>
          <div className="p-4">
            {(content.notes || []).length === 0 ? (
              <p className="text-slate-600">No notes available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(content.notes || []).map((note) => (
                  <a
                    key={note.id}
                    href={note.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:bg-slate-50"
                  >
                    <p className="text-sm font-extrabold text-slate-900">{note.title}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {note.file_size ? `${Math.round(note.file_size / 1024)} KB` : '—'}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDetails;
