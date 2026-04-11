import { useRef } from "react";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ClientAvatar({ initials, logoUrl, onUpload, onDelete, uploading, editable }) {
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const handleFileSelected = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onUpload(file);
    e.target.value = "";
  };

  return (
    <div className="relative flex-shrink-0 group/avatar">
      {/* Avatar — logo o iniciales */}
      <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={initials}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
            {initials}
          </div>
        )}
      </div>

      {/* Spinner de carga */}
      {uploading && (
        <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      )}

      {/* Overlay de edición — solo si editable y no cargando */}
      {editable && !uploading && (
        <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
          <button
            onClick={() => fileInputRef.current.click()}
            aria-label={t("clientDetail.uploadLogo")}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/35 text-white transition"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          {logoUrl && (
            <button
              onClick={onDelete}
              aria-label={t("clientDetail.deleteLogo")}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-red-500/70 text-white transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Input oculto */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
        aria-hidden="true"
      />
    </div>
  );
}