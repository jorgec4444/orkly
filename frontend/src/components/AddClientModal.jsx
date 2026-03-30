import { useState, useEffect } from "react";
import { X, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from 'react-hot-toast';

export default function AddClientModal({ onClose, onCreated, apiFetch }) {
  const [clientName, setClientName] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

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
      toast.success(t('addClient.success'));
      onCreated(newClient);
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <h2 className="text-base font-semibold text-gray-900">{t('addClient.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              {t('addClient.clientName')} <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={t('addClient.clientNamePlaceholder')}
              maxLength={100}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              {t('addClient.brandVoice')}{" "}
              <span className="text-gray-500 font-normal">{t('addClient.brandVoiceOptional')}</span>
            </label>
            <textarea
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              placeholder={t('addClient.brandVoicePlaceholder')}
              maxLength={1000}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition resize-none"
            />
            <span className="text-xs text-gray-500 text-right">
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
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
          >
            {t('addClient.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!clientName.trim() || loading}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-br from-primary to-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            {loading ? t('addClient.creating') : t('addClient.create')}
          </button>
        </div>
      </div>
    </div>
  );
}