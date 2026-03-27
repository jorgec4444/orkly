import { useState, useEffect } from "react";
import { X, Building2 } from "lucide-react";
import toast from 'react-hot-toast';

export default function AddClientModal({ onClose, onCreated, apiFetch }) {
  const [clientName, setClientName] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!clientName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const newClient = await apiFetch("/client/create", {
        method: "POST",
        body: JSON.stringify({
          client_name: clientName.trim(),
          brand_voice: brandVoice.trim() || null,
        }),
      });
      toast.success('Client created');
      onCreated(newClient);
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop — clic fuera cierra el modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">New client</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Client name <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Acme Corp"
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Brand voice{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              placeholder="e.g. Friendly and direct. Short sentences. No jargon."
              maxLength={1000}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition resize-none"
            />
            <span className="text-xs text-gray-400 text-right">
              {brandVoice.length}/1000
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!clientName.trim() || loading}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-br from-primary to-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            {loading ? "Creating…" : "Create client"}
          </button>
        </div>
      </div>
    </div>
  );
}
