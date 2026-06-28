import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SecurePlayer from '../components/player/SecurePlayer.jsx';
import PdfViewerModal from '../components/player/PdfViewerModal.jsx';
import axios from '../utils/axios-instance.js';

const BatchDetails = () => {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [content, setContent] = useState({ videos: [], notes: [] });
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
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
      const nextContent = contentResponse.data || { videos: [], notes: [] };
      setContent(nextContent);

      if (nextContent.videos?.length > 0) {
        setSelectedVideo((currentSelected) => {
          const stillExists = nextContent.videos.find((video) => video.id === currentSelected?.id);
          return stillExists || nextContent.videos[0];
        });
      } else {
        setSelectedVideo(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const openNoteViewer = (note) => {
    if (!note?.url) {
      return;
    }

    setSelectedNote(note);
  };

  const closeNoteViewer = () => {
    setSelectedNote(null);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:px-6 lg:px-8">
        <p className="text-red-600">Batch not found or access denied.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{batch.name}</h1>
        <p className="mt-2 text-slate-600">{batch.description}</p>
      </div>

      <div className="mb-6 flex space-x-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'videos' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          Videos ({content.videos?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'notes' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          Notes ({content.notes?.length || 0})
        </button>
      </div>

      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
          <div>
            {selectedVideo ? (
              <SecurePlayer bunnyVideoId={selectedVideo.url} title={selectedVideo.title} />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <p className="text-slate-600">No videos available</p>
              </div>
            )}
          </div>

          <div>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900">Lecture Roadmap</h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                      Watch in sequence
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {(content.videos || []).length} Total
                  </div>
                </div>
              </div>
              <div className="max-h-[620px] overflow-y-auto p-3">
                {(content.videos || []).map((video, index) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`mb-3 flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                      selectedVideo?.id === video.id
                        ? 'border-blue-200 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-sm">
                        {index + 1}
                      </div>
                      {index < (content.videos || []).length - 1 && (
                        <div className="h-10 w-px bg-slate-200"></div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{video.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {video.file_size ? `${Math.round(video.file_size / 1024 / 1024)} MB` : 'N/A'}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          Lecture
                        </span>
                      </div>
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
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <h3 className="font-extrabold text-slate-900">Notes</h3>
          </div>
          <div className="p-4">
            {(content.notes || []).length === 0 ? (
              <p className="text-slate-600">No notes available</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {(content.notes || []).map((note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:bg-slate-50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-6 w-6"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7.5 3.75h6.879a2.25 2.25 0 011.591.659l2.871 2.871a2.25 2.25 0 01.659 1.591V19.5A2.25 2.25 0 0117.25 21.75H7.5A2.25 2.25 0 015.25 19.5V6A2.25 2.25 0 017.5 3.75z"
                          />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 3.75v4.5h4.5" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15h7.5M8.25 11.25h3.75" />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-slate-900">{note.title}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {note.description || 'PDF note available to read inside the LMS.'}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {note.file_size ? `${Math.round(note.file_size / 1024)} KB` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openNoteViewer(note)}
                      className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      View PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <PdfViewerModal
        pdfUrl={selectedNote?.url}
        title={selectedNote?.title}
        isOpen={Boolean(selectedNote)}
        onClose={closeNoteViewer}
      />
    </div>
  );
};

export default BatchDetails;
