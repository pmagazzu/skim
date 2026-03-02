interface ConsumableResultProps {
  title: string;
  message: string;
  onDismiss: () => void;
}

export function ConsumableResult({ title, message, onDismiss }: ConsumableResultProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onDismiss}>
      <div
        className="bg-[#120f0c] border border-amber-800/40 rounded-2xl p-6 w-72 flex flex-col gap-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="title-font text-amber-400 text-xl text-center tracking-widest">{title}</h3>
        <p className="text-gray-300 text-sm text-center leading-relaxed">{message}</p>
        <button onClick={onDismiss} className="btn-primary text-sm px-8 mx-auto">OK</button>
      </div>
    </div>
  );
}
