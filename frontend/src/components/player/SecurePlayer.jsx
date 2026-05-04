import { useVideoPlayer } from '../../hooks/useVideoPlayer';

const SecurePlayer = ({ bunnyVideoId, title }) => {
  const { signedUrl, loading, error } = useVideoPlayer(bunnyVideoId);

  if (loading) return <div className="p-4 text-center">Loading video...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
      <iframe
        src={signedUrl}
        title={title || 'Video player'}
        className="w-full h-full"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        sandbox="allow-same-origin allow-scripts"
        style={{ border: 'none' }}
      />
      
      {/* Watermark overlay */}
      <div className="absolute bottom-4 right-4 pointer-events-none opacity-50">
        <span className="text-white text-xs font-bold">Prathamesh Sir's LMS</span>
      </div>
    </div>
  );
};

export default SecurePlayer;
