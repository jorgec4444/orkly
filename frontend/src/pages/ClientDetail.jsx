import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeft, Pencil, Check, X, Plus, Folder, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from 'react-hot-toast';
import FilterSelect from "../components/FilterSelect";
import { apiFetch } from "../utils/apiFetch";
import FolderSection from "../components/FolderSection";
import ClientAvatar from "../components/ClientAvatar";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", emoji: "📸", color: "text-pink-500", bg: "bg-pink-50 border-pink-200" },
  { id: "linkedin", label: "LinkedIn", emoji: "💼", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  { id: "twitter", label: "Twitter / X", emoji: "𝕏", color: "text-sky-500", bg: "bg-sky-50 border-sky-200" },
  { id: "tiktok", label: "TikTok", emoji: "♪", color: "text-gray-900", bg: "bg-gray-50 border-gray-200" },
  { id: "youtube", label: "YouTube", emoji: "▶", color: "text-red-500", bg: "bg-red-50 border-red-200" },
  { id: "facebook", label: "Facebook", emoji: "📘", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
];

const STYLE_COLORS = {
  professional: "bg-blue-50 text-blue-700 border-blue-200",
  casual: "bg-amber-50 text-amber-700 border-amber-200",
  viral: "bg-rose-50 text-rose-700 border-rose-200",
};

const DEFAULT_FOLDER_KEYS = ["folderBranding", "folderPhotos", "folderVideos", "folderContracts", "folderContent"];

function ClientDetail() {
  const { id } = useParams();
  const { clients, setClients } = useOutletContext();
  const [deleting, setDeleting] = useState(false);
  const [client, setClient] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingVoice, setEditingVoice] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState("");
  const [savingVoice, setSavingVoice] = useState(false);
  const [activePlatforms, setActivePlatforms] = useState([]);
  const [savingPlatforms, setSavingPlatforms] = useState(false);
  const [folders, setFolders] = useState([]);
  const [openFolder, setOpenFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const DEFAULT_FOLDERS = useMemo(() => [
    t('clientDetail.folderBranding'),
    t('clientDetail.folderPhotos'),
    t('clientDetail.folderVideos'),
    t('clientDetail.folderContracts'),
    t('clientDetail.folderContent'),
  ], [t]);

  useEffect(() => {
    (async () => {
      try {
        const cached = clients.find(c => c.id === parseInt(id));
        if (cached) {
          setClient(cached);
          setVoiceDraft(cached.brand_voice || "");
          setActivePlatforms(cached.platforms || []);
          const customFolders = cached.custom_folders || [];
          setFolders([...DEFAULT_FOLDER_KEYS, ...customFolders]);
        } else {
          const clientData = await apiFetch(`/client/${id}`);
          setClient(clientData);
          setVoiceDraft(clientData.brand_voice || "");
          setActivePlatforms(clientData.platforms || []);
          const customFolders = clientData.custom_folders || [];
          setFolders([...DEFAULT_FOLDER_KEYS, ...customFolders]);
        }
        const generationsData = await apiFetch(`/client/${id}/generations`);
        setGenerations(generationsData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSaveVoice = async () => {
    setSavingVoice(true);
    try {
      const updated = await apiFetch(`/client/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          brand_voice: voiceDraft.trim() || null,
        }),
      });
      setClient(updated);
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
      setEditingVoice(false);
      toast.success(t('clientDetail.brandVoiceUpdated'));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSavingVoice(false);
    }
  };

  const togglePlatform = async (platformId) => {
    const updated = activePlatforms.includes(platformId)
      ? activePlatforms.filter((p) => p !== platformId)
      : [...activePlatforms, platformId];
    setActivePlatforms(updated);
    setSavingPlatforms(true);
    try {
      const result = await apiFetch(`/client/${id}`, {
        method: "PUT",
        body: JSON.stringify({ platforms: updated }),
      });
      setClient(result);
      setClients(prev => prev.map(c => c.id === result.id ? result : c));
      toast.success(t('clientDetail.platformsUpdated'));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSavingPlatforms(false);
    }
  };

const handleAddFolder = async () => {
  if (!newFolderName.trim()) return;
  const newFolder = newFolderName.trim();
  const existingLabels = folders.map(f => 
    DEFAULT_FOLDER_KEYS.includes(f) ? t(`clientDetail.${f}`).toLowerCase() : f.toLowerCase()
  );
  if (existingLabels.includes(newFolder.toLowerCase())) {
    toast.error(t('clientDetail.folderAlreadyExists'));
    return;
  }
  const currentCustom = folders.filter(f => !DEFAULT_FOLDER_KEYS.includes(f));
  const updatedCustom = [...currentCustom, newFolder];

  setFolders(prev => [...prev, newFolder]);
  setNewFolderName("");
  setAddingFolder(false);

  try {
    await apiFetch(`/client/${id}`, {
      method: "PUT",
      body: JSON.stringify({ custom_folders: updatedCustom }),
    });
    toast.success(t('clientDetail.folderCreated'));
  } catch (e) {
    toast.error(e.message);
  }
};

const handleDeleteFolder = async (folder) => {
  if (!window.confirm(t('clientDetail.deleteFolderConfirm', { name: folder }))) return;
  if (DEFAULT_FOLDER_KEYS.includes(folder)) {
    toast.error(t('clientDetail.cannotDeleteDefaultFolder'));
    return;
  }
  const updatedFolders = folders.filter(f => f !== folder);
  setFolders(updatedFolders);
  if (openFolder === folder) setOpenFolder(null);

  const updatedCustom = updatedFolders.filter(f => !DEFAULT_FOLDER_KEYS.includes(f));
    try {
      await apiFetch(`/client/${id}`, {
        method: "PUT",
        body: JSON.stringify({ custom_folders: updatedCustom }),
      });
      await apiFetch(`/storage/delete-folder/${id}/${folder}`, {
        method: "DELETE"
      });
      toast.success(t("clientDetail.folderDeleted"));
    } catch(e) {
      toast.error(e.message)
    }
  };

  const handleUploadLogo = async (file) => {
    setUploadingLogo(true);
    try {
      const { url, file_path } = await apiFetch(`/storage/upload/${id}/logo`, {
        method: "POST",
        body: JSON.stringify({ file_name: file.name, mime_type: file.type }),
      });
      await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const updated = await apiFetch(`/client/${id}`, {
        method: "PUT",
        body: JSON.stringify({ logo_url: file_path }),
      });
      setClient(updated);
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
      toast.success(t("clientDetail.logoUploaded"));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async () => {
    try {
      const updated = await apiFetch(`/client/${id}`, {
        method: "PUT",
        body: JSON.stringify({ logo_url: null }),
      });
      setClient(updated);
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
      toast.success(t("clientDetail.logoDeleted"));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDeleteClient = async () => {
    if (!window.confirm(t('clientDetail.deleteConfirm', { name: client.client_name }))) return;
    setDeleting(true);
    try {
      await apiFetch(`/client/${client.id}`, { method: "DELETE" });
      setClients(prev => prev.filter(c => c.id !== parseInt(id)));
      navigate("/dashboard/clients", { replace: true });
      toast.success(t('clientDetail.deleted'));
    } catch (e) {
      toast.error(e.message);
      setDeleting(false);
    }
  };

  const filteredGenerations = generations.filter((g) =>
    platformFilter === "all" ? true : g.platform === platformFilter
  );

  const formattedDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
      {t('clientDetail.loading')}
    </div>
  );

  if (error) return (
    <div className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</div>
  );

  const initials = client.client_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  
  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Back ── */}
      <button
        onClick={() => navigate("/dashboard/clients")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('clientDetail.back')}
      </button>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <ClientAvatar
            initials={initials}
            logoUrl={client.logo_url}
            onUpload={handleUploadLogo}
            onDelete={handleDeleteLogo}
            uploading={uploadingLogo}
            editable
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.client_name}</h1>
            <p className="text-sm text-gray-500">{t('clientDetail.addedOn')} {formattedDate(client.created_at)}</p>
          </div>
        </div>
        <button
          onClick={handleDeleteClient}
          disabled={deleting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-500 border border-red-200 hover:bg-red-50 transition disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
          {t('clientDetail.deleteClient')}
        </button>
      </div>

      <div className="flex flex-col gap-6">

        {/* ── Brand voice ── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('clientDetail.brandVoice')}</h2>
              <div className="relative group/tooltip">
                <span className="text-xs text-gray-500 cursor-help">ⓘ</span>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 px-3 py-2 bg-gray-800 text-white text-xs rounded-xl opacity-0 group-hover/tooltip:opacity-95 transition-opacity pointer-events-none z-10 leading-relaxed">
                  {t('clientDetail.brandVoiceTooltip')}
                </div>
              </div>
            </div>
            {!editingVoice && (
              <button
                onClick={() => setEditingVoice(true)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> {t('clientDetail.editBrandVoice')}
              </button>
            )}
          </div>

          {editingVoice ? (
            <div className="flex flex-col gap-3">
              <textarea
                autoFocus
                value={voiceDraft}
                onChange={(e) => setVoiceDraft(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder={t('clientDetail.brandVoicePlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setVoiceDraft(client.brand_voice || ""); setEditingVoice(false); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition"
                >
                  <X className="w-3.5 h-3.5" /> {t('clientDetail.cancel')}
                </button>
                <button
                  onClick={handleSaveVoice}
                  disabled={savingVoice}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:opacity-90 disabled:opacity-40 transition"
                >
                  <Check className="w-3.5 h-3.5" /> {savingVoice ? t('clientDetail.saving') : t('clientDetail.save')}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed">
              {client.brand_voice || (
                <span className="text-gray-500 italic">{t('clientDetail.noBrandVoice')}</span>
              )}
            </p>
          )}
        </section>

        {/* ── Platforms ── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('clientDetail.platforms')}</h2>
            {savingPlatforms && <span className="text-xs text-gray-500">{t('clientDetail.saving')}</span>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PLATFORMS.map(({ id: pid, label, emoji, color, bg }) => {
              const active = activePlatforms.includes(pid);
              return (
                <button
                  key={pid}
                  onClick={() => togglePlatform(pid)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    active
                      ? `${bg} ${color} shadow-sm`
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <span className="text-base leading-none">{emoji}</span>
                  {label}
                  {active && <Check className="w-3.5 h-3.5 ml-auto" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Folders ── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('clientDetail.folders')}</h2>
            <button
              onClick={() => setAddingFolder(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> {t('clientDetail.newFolder')}
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {folders.map((folder) => (
              <FolderSection
                key={folder}
                clientId={parseInt(id)}
                folderKey={folder}
                folderLabel={DEFAULT_FOLDER_KEYS.includes(folder) ? t(`clientDetail.${folder}`) : folder}
                isOpen={openFolder === folder}
                onToggle={() => setOpenFolder(openFolder === folder ? null : folder)}
                onDelete={() => handleDeleteFolder(folder)}
              />
            ))}

            {addingFolder && (
              <div className="flex items-center gap-2 px-3 py-2">
                <Folder className="w-4 h-4 text-primary flex-shrink-0" />
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddFolder();
                    if (e.key === "Escape") { setAddingFolder(false); setNewFolderName(""); }
                  }}
                  placeholder={t('clientDetail.folderNamePlaceholder')}
                  className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
                <button onClick={handleAddFolder} className="text-primary hover:opacity-70 transition">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => { setAddingFolder(false); setNewFolderName(""); }} className="text-gray-500 hover:text-gray-600 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Generation history ── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {t('clientDetail.generationHistory')}
              <span className="ml-2 text-xs font-normal text-gray-500 normal-case">
                {t('clientDetail.totalGenerations')} {generations.length}
              </span>
            </h2>
            <FilterSelect
              value={platformFilter}
              onChange={setPlatformFilter}
              options={[
                { value: 'all', label: t('clientDetail.allPlatforms') },
                ...PLATFORMS.map(p => ({ value: p.id, label: p.label, emoji: p.emoji }))
              ]}
            />
          </div>

          {filteredGenerations.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 text-center">
              {platformFilter === "all"
                ? t('clientDetail.noGenerations')
                : t('clientDetail.noGenerationsForPlatform', { platform: platformFilter })}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredGenerations.map((g) => (
                <div key={g.id} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-2 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-2 flex-wrap">
                    {g.style && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STYLE_COLORS[g.style] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
                        {g.style}
                      </span>
                    )}
                    {g.platform && (
                      <span className="text-xs text-gray-500 capitalize">{g.platform}</span>
                    )}
                    <span className="text-xs text-gray-300 ml-auto">{formattedDate(g.created_at)}</span>
                  </div>
                  {g.text_original && (
                    <p className="text-xs text-gray-500 line-clamp-1">
                      <span className="font-medium">{t('clientDetail.original')}:</span> {g.text_original}
                    </p>
                  )}
                  <p className="text-sm text-gray-700 leading-relaxed">{g.text_improved}</p>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default ClientDetail;
