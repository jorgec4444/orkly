import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../supabase";
import { ChevronDown, Check } from "lucide-react";
import toast from 'react-hot-toast';

// ─── Constants ───────────────────────────────────────────────────────────────

//const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const API_BASE = "http://127.0.0.1:8000";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "linkedin",  label: "LinkedIn",  emoji: "💼" },
  { id: "twitter",   label: "Twitter/X", emoji: "𝕏"  },
  { id: "tiktok",    label: "TikTok",    emoji: "♪"  },
  { id: "youtube",   label: "YouTube",   emoji: "▶"  },
  { id: "twitch",    label: "Twitch",    emoji: "🎮" },
];

const CREATIVITY_LEVELS = [
  { id: "precise",  label: "Precise",  emoji: "🎯", description: "Faithful to your original",  temperature: 0.4 },
  { id: "balanced", label: "Balanced", emoji: "⚡", description: "The sweet spot",              temperature: 0.7 },
  { id: "creative", label: "Creative", emoji: "🔥", description: "Bold and unexpected",         temperature: 1.0 },
];

const STYLE_COLORS = {
  professional: "bg-blue-50 text-blue-700 border-blue-200",
  casual:       "bg-amber-50 text-amber-700 border-amber-200",
  viral:        "bg-rose-50 text-rose-700 border-rose-200",
};

const STYLE_META = {
  professional: { label: "Professional", desc: "LinkedIn · clear and direct" },
  casual:       { label: "Casual",       desc: "Friendly · with emojis"      },
  viral:        { label: "Viral",        desc: "Max engagement"               },
};

const TEMPLATES = {
  launch:       "After [X months] of work, today we launch [product name]. [Brief description]. I am [emotion] to share this.",
  milestone:    "🎯 Milestone: [number/achievement]. [Time] ago we started with [situation]. Today we celebrate [achievement].",
  lesson:       "💡 Lesson learned [where]: [main lesson]. Before I thought [old belief]. Now I understand [new perspective].",
  announcement: "📢 [What you are announcing]. Starting [when], [what changes]. This means [benefit]. [Call to action].",
  question:     "Question for the community: [specific question]? In my experience [context]. How do you do it?",
};

// ─── API helper ──────────────────────────────────────────────────────────────

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
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ClientSelector({ clients, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const selectedClient = clients.find(c => c.id === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${
          selected
            ? "bg-white border-primary/40 text-gray-900 shadow-sm"
            : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedClient ? (
            <>
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {selectedClient.client_name[0].toUpperCase()}
              </div>
              <span className="font-medium truncate">{selectedClient.client_name}</span>
              {selectedClient.brand_voice && (
                <span className="text-xs text-primary bg-primary/8 px-2 py-0.5 rounded-full flex-shrink-0">
                  Voice set
                </span>
              )}
            </>
          ) : (
            <span>Select a client…</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => { onSelect(null); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 transition-colors"
          >
            No client (generic)
          </button>
          <div className="border-t border-gray-100" />
          {clients.map(c => (
            <button
              key={c.id}
              onClick={() => { onSelect(c.id); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {c.client_name[0].toUpperCase()}
              </div>
              <span className="text-gray-700 flex-1 text-left truncate">{c.client_name}</span>
              {c.brand_voice && (
                <span className="text-xs text-primary">✓ voice</span>
              )}
              {selected === c.id && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function VariationCard({ variation, selected, onSelect, onCopy, copied }) {
  const { version, text } = variation;
  const meta = STYLE_META[version] || { label: version, desc: "" };
  const colorClass = STYLE_COLORS[version] || "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <div
      className={`bg-white border rounded-2xl p-4 flex flex-col gap-3 transition-all hover:shadow-md ${
        selected ? "border-primary ring-2 ring-primary/15 shadow-md" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
            {meta.label}
          </span>
          <p className="text-xs text-gray-400 mt-1">{meta.desc}</p>
        </div>
        {selected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed flex-1">{text}</p>
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={() => onCopy(version, text)}
          className={`flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all bg-primary/8 text-primary hover:bg-primary/15`}
        >
          {copied === version ? "✓ Copied" : "Copy"}
        </button>
        <button
          onClick={() => onSelect(variation)}
          className={`flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            selected
              ? "bg-green-50 text-green-600 border border-green-200"
              : "bg-primary text-white hover:opacity-90"
          }`}
        >
          {selected ? "✓ Saved" : "Save this"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function CreateContent() {
  const { clients } = useOutletContext();

  // Step state
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [text, setText] = useState("");
  const [creativity, setCreativity] = useState("balanced");

  // Generation state
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState(null);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const charCount = text.length;
  const charOver = charCount > 500;
  const charWarn = charCount > 400 && !charOver;
  const selectedCreativity = CREATIVITY_LEVELS.find(c => c.id === creativity);
  const canGenerate = text.trim() && !charOver && selectedPlatform;

  const selectedClient = useMemo(
    () => clients.find(c => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setVariations(null);
    setSelected(null);
    setSaved(false);
    setError(null);

    try {
      const data = await apiFetch("/text-generation/improve-text", {
        method: "POST",
        body: JSON.stringify({
          text: text.trim(),
          client_id: selectedClientId || null,
          temperature: selectedCreativity.temperature,
        }),
      });
      setVariations(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVariation = async (variation) => {
    setSelected(variation.version);
    setSaved(false);

    try {
      await apiFetch("/text-generation/save", {
        method: "POST",
        body: JSON.stringify({
          original_text: text.trim(),
          selected_text: variation.text,
          style: variation.version,
          client_id: selectedClientId || null,
          platform: selectedPlatform,
        }),
      });
      setSaved(true);
      toast.success('Saved to history');
    } catch (e) {
      toast.error('Could not save to history');
    }
  };

  const handleCopy = async (version, txt) => {
    await navigator.clipboard.writeText(txt);
    setCopied(version);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleReset = () => {
    setText("");
    setVariations(null);
    setSelected(null);
    setSaved(false);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create content</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate AI-powered content tailored to your client's brand voice
        </p>
      </div>

      <div className="flex flex-col gap-5">

        {/* ── Step 1: Client + Platform ── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            1 · Client & platform
          </p>

          <ClientSelector
            clients={clients}
            selected={selectedClientId}
            onSelect={setSelectedClientId}
          />

          {/* Brand voice hint */}
          {selectedClient?.brand_voice && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-xl">
              <span className="text-primary text-sm mt-0.5">✦</span>
              <p className="text-xs text-primary/80 leading-relaxed">
                <span className="font-medium">Brand voice active</span>
                <span className="relative group/tooltip inline-block ml-1">
                  <span className="text-primary/50 cursor-help">ⓘ</span>
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 px-3 py-2 bg-gray-800 text-white text-xs rounded-xl opacity-0 group-hover/tooltip:opacity-95 transition-opacity pointer-events-none z-10 leading-relaxed">
                    The AI will write in this client's tone automatically. i.e "friendly and professional", "witty and casual", "inspirational and viral", etc.
                  </span>
                </span>
                {" "}· {selectedClient.brand_voice.slice(0, 80)}{selectedClient.brand_voice.length > 80 ? "…" : ""}
              </p>
            </div>
          )}

          {/* Platform selector */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PLATFORMS.map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => setSelectedPlatform(id === selectedPlatform ? null : id)}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  selectedPlatform === id
                    ? "bg-primary/8 border-primary/30 text-primary shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <span className="text-lg leading-none">{emoji}</span>
                <span className="truncate w-full text-center">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Step 2: Text + Creativity ── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            2 · Your draft
          </p>

          {/* Templates */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-mono">templates →</span>
            {Object.entries({
              launch: "🚀 Launch", milestone: "🎯 Milestone",
              lesson: "💡 Lesson", announcement: "📢 Announcement", question: "❓ Question",
            }).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setText(TEMPLATES[key])}
                className="text-xs font-mono px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-500 hover:border-primary hover:text-primary transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div className={`border rounded-xl transition-all focus-within:ring-2 focus-within:ring-primary/15 ${
            charOver ? "border-red-300" : "border-gray-200 focus-within:border-primary/40"
          }`}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === "Enter" && handleGenerate()}
              placeholder="Write or paste your draft here… (Ctrl+Enter to generate)"
              rows={5}
              className="w-full px-4 py-3 bg-transparent rounded-xl resize-none outline-none text-gray-900 placeholder-gray-400 text-sm leading-relaxed"
            />
            <div className="flex items-center justify-end px-4 pb-3">
              <span className={`text-xs font-mono ${
                charOver ? "text-red-500" : charWarn ? "text-amber-500" : "text-gray-400"
              }`}>
                {charCount} / 500
              </span>
            </div>
          </div>

          {/* Creativity */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-400 font-medium">Creativity level</p>
            <div className="grid grid-cols-3 gap-2">
              {CREATIVITY_LEVELS.map(({ id, label, emoji, description }) => (
                <button
                  key={id}
                  onClick={() => setCreativity(id)}
                  className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-xs font-medium transition-all ${
                    creativity === id
                      ? "bg-primary/8 border-primary/30 text-primary shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl leading-none">{emoji}</span>
                  <span className="font-semibold">{label}</span>
                  <span className={`text-center leading-tight ${creativity === id ? "text-primary/70" : "text-gray-400"}`}>
                    {description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating 3 variations…
              </>
            ) : (
              "Generate content →"
            )}
          </button>

          {!selectedPlatform && text.trim() && (
            <p className="text-xs text-amber-500 text-center -mt-2">
              Select a platform to generate
            </p>
          )}
        </section>

        {/* ── Error ── */}
        {error && (
          <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* ── Step 3: Variations ── */}
        {variations && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                3 · Pick your variation
              </p>
              <button
                onClick={handleReset}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                ↩ Start over
              </button>
            </div>

            {saved && selected && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-600">
                <Check className="w-3.5 h-3.5" />
                Saved to {selectedClient?.client_name || "history"}'s generation history
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {variations.variations?.map((variation) => (
                <VariationCard
                  key={variation.version}
                  variation={variation}
                  selected={selected === variation.version}
                  onSelect={handleSelectVariation}
                  onCopy={handleCopy}
                  copied={copied}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
