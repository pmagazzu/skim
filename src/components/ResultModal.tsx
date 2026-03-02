interface ResultModalProps {
  title: string;
  message: string;
  onDismiss: () => void;
}

export function ResultModal({ title, message, onDismiss }: ResultModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="bg-[#120f0c] border border-amber-800/50 rounded-2xl p-7 w-80 flex flex-col gap-4 shadow-2xl text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="title-font text-amber-300 text-xl tracking-widest leading-snug">{title}</div>
        <div className="text-gray-300 text-sm leading-relaxed">{message}</div>
        <button onClick={onDismiss} className="btn-primary text-sm px-8 py-2 mt-1">
          OK
        </button>
      </div>
    </div>
  );
}
