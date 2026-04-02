import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { supabase } from "../supabase";
import { ArrowLeft, Pencil, Check, X, Plus, Folder, FolderOpen, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from 'react-hot-toast';
import FilterSelect from "../components/FilterSelect";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail;
    const message = typeof detail === 'string' 
      ? detail 
      : detail?.message || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

const PLATFORMS = [
  { id: "instagram", label: "Instagram", emoji: "📸", color: "text-pink-500", bg: "bg-pink-50 border-pink-200" },
  { id: "linkedin", label: "LinkedIn", emoji: "💼", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  { id: "twitter", label: "Twitter / X", emoji: "𝕏", color: "text-sky-500", bg: "bg-sky-50 border-sky-200" },
  { id: "tiktok", label: "TikTok", emoji: "♪", color: "text-gray-900", bg: "bg-gray-50 border-gray-200" },
  { id: "youtube", label: "YouTube", emoji: "▶", color: "text-red-500", bg: "bg-red-50 border-red-200" },
  { id: "twitch", label: "Twitch", emoji: "🎮", color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
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
          setFolders(cached.folders || DEFAULT_FOLDER_KEYS);
        } else {
          const clientData = await apiFetch(`/client/${id}`);
          setClient(clientData);
          setVoiceDraft(clientData.brand_voice || "");
          setActivePlatforms(clientData.platforms || []);
          setFolders(clientData.folders || DEFAULT_FOLDERS);
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
          client_name: client.client_name,
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

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    setFolders((prev) => [...prev, newFolderName.trim()]);
    setNewFolderName("");
    setAddingFolder(false);
  };

  const handleDeleteFolder = (folder) => {
    if (!window.confirm(t('clientDetail.deleteFolderConfirm', { name: folder }))) return;
    setFolders((prev) => prev.filter((f) => f !== folder));
    if (openFolder === folder) setOpenFolder(null);
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
            {initials}
          </div>
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
              <div key={folder}>
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                  <button
                    onClick={() => setOpenFolder(openFolder === folder ? null : folder)}
                    className="flex items-center gap-2.5 text-sm text-gray-700 flex-1 text-left"
                  >
                    {openFolder === folder
                      ? <FolderOpen className="w-4 h-4 text-primary" />
                      : <Folder className="w-4 h-4 text-gray-500" />
                    }
                    {DEFAULT_FOLDER_KEYS.includes(folder) 
                      ? t(`clientDetail.${folder}`) 
                      : folder
                    }
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {openFolder === folder && (
                  <div className="ml-9 mt-1 mb-2 px-3 py-3 bg-gray-50 rounded-xl text-xs text-gray-500 italic">
                    {t('clientDetail.fileUploadSoon')}
                  </div>
                )}
              </div>
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