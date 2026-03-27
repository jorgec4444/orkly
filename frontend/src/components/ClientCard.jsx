import { useState } from "react";
import { Calendar, AlertCircle, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';

export default function ClientCard({ client, onDeleted, onUpdated, apiFetch }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(client.client_name);
  const [editVoice, setEditVoice] = useState(client.brand_voice || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const initials = client.client_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const formattedDate = new Date(client.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const hasBrandVoice = Boolean(client.brand_voice);

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await apiFetch(`/client/${client.id}`, {
        method: "PUT",
        body: JSON.stringify({
          client_name: editName.trim(),
          brand_voice: editVoice.trim() || null,
        }),
      });
      onUpdated(updated);
      toast.success('Changes saved');
      setEditing(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${client.client_name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await apiFetch(`/client/${client.id}`, { method: "DELETE" });
      onDeleted(client.id);
      toast.success('Client deleted');
    } catch (e) {
      toast.error(e.message);
      setDeleting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(client.client_name);
    setEditVoice(client.brand_voice || "");
    setError(null);
    setEditing(false);
  };

  return (
    <div 
    onClick={() => !editing && navigate(`/dashboard/clients/${client.id}`)}
    className="bg-white dark:bg-[var(--color-surface)] border border-gray-200 dark:border-[var(--color-border)] rounded-2xl p-5 flex flex-col gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        {/* Avatar + name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-base flex-shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="min-w-0">
            {editing ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                maxLength={100}
                className="w-full px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-[var(--color-bg)] border border-gray-200 dark:border-[var(--color-border)] text-gray-900 dark:text-[var(--color-text-primary)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            ) : (
              <p className="font-semibold text-gray-900 dark:text-[var(--color-text-primary)] truncate">
                {client.client_name}
              </p>
            )}
          </div>
        </div>

        {/* Status icon + action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {!editing && (
            hasBrandVoice
              ? <CheckCircle2 className="w-4 h-4 text-green-500" />
              : <AlertCircle className="w-4 h-4 text-amber-400" />
          )}

          {!editing && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                title="Edit"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-[var(--color-text-primary)] hover:bg-gray-100 dark:hover:bg-[var(--color-bg)] transition"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                disabled={deleting}
                title="Delete"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 transition disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Brand voice ── */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-gray-400 dark:text-[var(--color-text-muted)] uppercase tracking-wide">
          Brand voice
        </p>
        {editing ? (
          <textarea
            value={editVoice}
            onChange={(e) => setEditVoice(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Describe the brand voice…"
            className="w-full px-2.5 py-2 rounded-lg bg-gray-50 dark:bg-[var(--color-bg)] border border-gray-200 dark:border-[var(--color-border)] text-gray-900 dark:text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-primary transition resize-none"
          />
        ) : (
          <p className="text-sm text-gray-600 dark:text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
            {client.brand_voice || (
              <span className="text-gray-400 dark:text-[var(--color-text-muted)] italic">
                No brand voice set
              </span>
            )}
          </p>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-400/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-[var(--color-border)]">
        {editing ? (
          <div className="flex gap-2 w-full justify-end">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-[var(--color-bg)] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editName.trim() || saving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-[var(--color-text-muted)]">
              <Calendar className="w-3.5 h-3.5" />
              <span>Added {formattedDate}</span>
            </div>

            {hasBrandVoice ? (
              <span className="text-xs border border-green-400 text-green-600 dark:text-green-400 px-2.5 py-0.5 rounded-full">
                Voice set
              </span>
            ) : (
              <span className="text-xs bg-amber-50 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full">
                No voice
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}