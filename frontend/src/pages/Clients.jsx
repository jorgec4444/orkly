import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { supabase } from "../supabase";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ClientCard from "../components/ClientCard";
import AddClientModal from "../components/AddClientModal";
import FilterSelect from '../components/FilterSelect';

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function apiFetch(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
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

function Clients() {
  const { clients, setClients, clientsLoading: loading } = useOutletContext();
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("alphabetical");
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();

  const filteredClients = useMemo(() => {
    let filtered = clients.filter((c) =>
      c.client_name.toLowerCase().includes(search.toLowerCase())
    );

    switch (sortBy) {
      case "alphabetical":
        return [...filtered].sort((a, b) =>
          a.client_name.localeCompare(b.client_name)
        );
      case "newest":
        return [...filtered].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
      case "oldest":
        return [...filtered].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
      default:
        return filtered;
    }
  }, [clients, search, sortBy]);

  const handleDeleted = (id) => setClients((prev) => prev.filter((c) => c.id !== id));
  const handleUpdated = (updated) => setClients((prev) => prev.map((c) => c.id === updated.id ? updated : c));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('clients.title')}</h1>
          <p className="text-gray-600 mt-1 text-sm">{t('clients.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-primary to-accent text-white text-sm font-semibold hover:opacity-90 transition shadow-sm"
        >
          {t('clients.newClient')}
        </button>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 bg-white border border-gray-200 rounded-xl p-3">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder={t('clients.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>
        <FilterSelect
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: 'alphabetical', label: t('clients.sortAlphabetical') },
            { value: 'newest', label: t('clients.sortNewest') },
            { value: 'oldest', label: t('clients.sortOldest') },
          ]}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">{t('clients.totalClients')}</p>
          <p className="text-2xl font-bold mt-1">{clients.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">{t('clients.withBrandVoice')}</p>
          <p className="text-2xl font-bold mt-1 text-emerald-500">
            {clients.filter((c) => c.brand_voice).length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">{t('clients.addedThisMonth')}</p>
          <p className="text-2xl font-bold mt-1 text-primary">
            {clients.filter(
              (c) =>
                new Date(c.created_at).getMonth() === new Date().getMonth() &&
                new Date(c.created_at).getFullYear() === new Date().getFullYear()
            ).length}
          </p>
        </div>
      </div>

      {/* States */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          {t('clients.loading')}
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-500">{error}</div>
      )}

      {!loading && !error && filteredClients.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">{t('clients.noClientsFound')}</p>
        </div>
      )}

      {!loading && !error && filteredClients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              apiFetch={apiFetch}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddClientModal
          onClose={() => setShowModal(false)}
          onCreated={(newClient) => setClients((prev) => [newClient, ...prev])}
          apiFetch={apiFetch}
        />
      )}
    </div>
  );
}

export default Clients;