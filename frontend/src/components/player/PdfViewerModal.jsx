import { useEffect } from 'react';

const PdfViewerModal = ({ pdfUrl, title, isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !pdfUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 py-4 sm:px-6 sm:py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'PDF viewer'}
    >
      <div
        className="relative flex h-[92vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-2xl sm:h-[88vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-lg transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Close PDF viewer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <iframe
          src={pdfUrl}
          title={title || 'PDF document'}
          type="application/pdf"
          className="h-full w-full border-0"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default PdfViewerModal;
