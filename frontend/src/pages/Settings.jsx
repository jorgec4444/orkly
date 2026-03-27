import { useOutletContext, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { LogOut, Trash2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export default function Settings() {
  const { user } = useOutletContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    toast.error("Account deletion is not available yet. Please contact jorgecdev444@gmail.com");
  };

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* ── Account ── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Account</h2>

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
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {user?.user_metadata?.full_name || "Orkly User"}
              </p>
              <p className="text-sm text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </section>

        {/* ── Plan ── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Free plan</p>
              <p className="text-xs text-gray-400 mt-0.5">15 generations per day</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
              Free
            </span>
          </div>
        </section>

        {/* ── Legal ── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Legal</h2>
          <div className="flex flex-col gap-2">
            {[
              { label: "Terms of Service", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <span className="text-sm text-gray-700">{label}</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </section>

        {/* ── Danger zone ── */}
        <section className="bg-white border border-red-100 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-4">Danger zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Delete account</p>
              <p className="text-xs text-gray-400 mt-0.5">Permanently delete your account and all data</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-400 border border-red-200 hover:bg-red-50 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
