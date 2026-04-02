import { useOutletContext, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../supabase";
import { LogOut, Trash2, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import LanguageSelector from "../components/LanguageSelector";

function EditDisplayName({ user, t }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name.trim() || null }
    });
    if (!error) {
      toast.success(t('settings.nameSaved'));
      setEditing(false);
      await supabase.auth.refreshSession();
    } else {
      toast.error(t('settings.nameError'));
    }
    setSaving(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 mb-1">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
          placeholder={t('auth.displayNamePlaceholder')}
          className="flex-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary transition"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-medium hover:opacity-90 disabled:opacity-40 transition"
        >
          {saving ? t('settings.saving') : t('settings.save')}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="px-2.5 py-1 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition"
        >
          {t('settings.cancel')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 mb-1">
      <p className="font-semibold text-gray-900 truncate">
        {user?.user_metadata?.full_name || t('settings.noName') }
      </p>
      <button
        onClick={() => setEditing(true)}
        className="flex-shrink-0 text-xs text-gray-400 hover:text-primary transition-colors"
      >
        ✏️ {t('settings.editName')}
      </button>
    </div>
  );
}

export default function Settings() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(t('settings.signedOut'));
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(t('settings.deleteAccountDesc'))) return;
    toast.error(t('settings.deleteAccountUnavailable'));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* ── Account ── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">{t('settings.account')}</h2>

          <div className="flex items-center gap-4">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {user?.email?.[0].toUpperCase()}
              </div>
            )}

            {/* Editar nombre */}
            <div className="min-w-0 flex-1">
              <EditDisplayName user={user} t={t} />
              <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t('settings.signOut')}
            </button>
          </div>
        </section>

        {/* ── Language ── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">{t('settings.language')}</h2>
          <LanguageSelector variant="light" />
        </section>

        {/* ── Plan ── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {t('settings.plan')}
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{t('settings.freePlan')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('settings.freeLimit')}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {t('settings.free')}
              </span>
              <button
                onClick={() => navigate("/pricing")}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-white hover:opacity-90 transition"
              >
                {t('settings.upgradePlan')}
              </button>
            </div>
          </div>
        </section>

        {/* ── Legal ── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">{t('settings.legal')}</h2>
          <div className="flex flex-col gap-2">
            {[
              { label: t('settings.termsOfService'), href: "/terms" },
              { label: t('settings.privacyPolicy'), href: "/privacy" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <span className="text-sm text-gray-700">{label}</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </section>

        {/* ── Danger zone ── */}
        <section className="bg-white border border-red-100 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-4">{t('settings.dangerZone')}</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{t('settings.deleteAccount')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('settings.deleteAccountDesc')}</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-500 border border-red-200 hover:bg-red-50 transition"
            >
              <Trash2 className="w-4 h-4" />
              {t('settings.delete')}
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}