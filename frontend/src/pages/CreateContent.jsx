import { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { ChevronDown, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from 'react-hot-toast';
import Button from "../components/Button";
import { apiFetch } from "../utils/apiFetch";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "linkedin",  label: "LinkedIn",  emoji: "💼" },
  { id: "twitter",   label: "Twitter/X", emoji: "𝕏"  },
  { id: "tiktok",    label: "TikTok",    emoji: "♪"  },
  { id: "youtube",   label: "YouTube",   emoji: "▶"  },
  { id: "facebook",  label: "Facebook",   emoji: "📘" },
]; 

const STYLE_COLORS = {
  professional: "bg-blue-50 text-blue-700 border-blue-200",
  casual:       "bg-amber-50 text-amber-700 border-amber-200",
  viral:        "bg-rose-50 text-rose-700 border-rose-200",
};

function ClientSelector({ clients, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const selectedClient = clients.find(c => c.id === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${
          selected
            ? "bg-white border-primary/40 text-gray-900 shadow-sm"
            : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
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
                  {t('createContent.voiceSet')}
                </span>
              )}
            </>
          ) : (
            <span>{t('createContent.selectClient')}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => { onSelect(null); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {t('createContent.noClient')}
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
                <span className="text-xs text-primary">✓ {t('createContent.voiceSet')}</span>
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
  const { t } = useTranslation();
  const meta = t(`createContent.styleMeta.${version}`, { returnObjects: true }) || { label: version, desc: "" };
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
          <p className="text-xs text-gray-500 mt-1">{meta.desc}</p>
        </div>
        {selected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed flex-1">{text}</p>
      <div className="flex items-center gap-2 mt-1">
        <button
          onClick={() => onCopy(version, text)}
          className="flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all bg-primary/8 text-primary hover:bg-primary/15"
        >
          {copied === version ? t('createContent.copied') : t('createContent.copy')}
        </button>
        <button
          onClick={() => onSelect(variation)}
          className={`flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            selected
              ? "bg-green-50 text-green-600 border border-green-200"
              : "bg-primary text-white hover:opacity-90"
          }`}
        >
          {selected ? t('createContent.savedVariation') : t('createContent.saveThis')}
        </button>
      </div>
    </div>
  );
}

export default function CreateContent() {
  const { clients } = useOutletContext();
  const { t, i18n } = useTranslation();

  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [text, setText] = useState("");
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [creativity, setCreativity] = useState("balanced");
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState(null);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const TEMPLATES = useMemo(() => ({
    launch: t('templates.launch'),
    milestone: t('templates.milestone'),
    lesson: t('templates.lesson'),
    announcement: t('templates.announcement'),
    question: t('templates.question'),
  }), [t]);

  const CREATIVITY_LEVELS = useMemo(() => [
    { id: "precise",  emoji: "🎯", ...t('createContent.creativity.precise',  { returnObjects: true }), temperature: 0.4 },
    { id: "balanced", emoji: "⚡", ...t('createContent.creativity.balanced', { returnObjects: true }), temperature: 0.7 },
    { id: "creative", emoji: "🔥", ...t('createContent.creativity.creative', { returnObjects: true }), temperature: 1.0 },
  ], [t]);

  useEffect(() => {
    if (activeTemplate) {
      setText(TEMPLATES[activeTemplate]);
    } else {
      setText("");
      setVariations(null);
      setSelected(null);
      setSaved(false);
      setError(null);
    }
  }, [i18n.language]);

  const charCount = text.length;
  const charOver = charCount > 500;
  const charWarn = charCount > 400 && !charOver;

  const selectedCreativity = CREATIVITY_LEVELS.find(c => c.id === creativity);
  const canGenerate = text.trim() && !charOver && selectedPlatform && selectedClientId;

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
          platform: selectedPlatform,
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
      toast.success(t('createContent.savedSuccess'));
    } catch (e) {
      toast.error(t('createContent.couldNotSave'));
    }
  };

  const handleCopy = async (version, txt) => {
    await navigator.clipboard.writeText(txt);
    setCopied(version);
    toast.success(t('createContent.copiedSuccess'));
    setTimeout(() => setCopied(null), 2000);
  };

  const handleReset = () => {
    setText("");
    setActiveTemplate(null);
    setVariations(null);
    setSelected(null);
    setSaved(false);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('createContent.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">{t('createContent.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* ── Step 1: Client + Platform ── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {t('createContent.step1')}
          </p>

          <ClientSelector
            clients={clients}
            selected={selectedClientId}
            onSelect={setSelectedClientId}
          />

          {selectedClient?.brand_voice && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-xl">
              <span className="text-primary text-sm mt-0.5">✦</span>
              <p className="text-xs text-primary/80 leading-relaxed">
                <span className="font-medium">{t('createContent.brandVoiceActive')}</span>
                <span className="relative group/tooltip inline-block ml-1">
                  <span className="text-primary/50 cursor-help">ⓘ</span>
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 px-3 py-2 bg-gray-800 text-white text-xs rounded-xl opacity-0 group-hover/tooltip:opacity-95 transition-opacity pointer-events-none z-10 leading-relaxed">
                    {t('createContent.brandVoiceTooltip')}
                  </span>
                </span>
                {" "}· {selectedClient.brand_voice.slice(0, 80)}{selectedClient.brand_voice.length > 80 ? "…" : ""}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PLATFORMS.map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => setSelectedPlatform(id === selectedPlatform ? null : id)}
                className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  selectedPlatform === id
                    ? "bg-primary/8 border-primary/30 text-primary shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
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
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {t('createContent.step2')}
          </p>

          {/* Templates */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 font-mono">{t('createContent.templatesLabel')}</span>
            {Object.entries(t('createContent.templateLabels', { returnObjects: true })).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTemplate(key);
                  setText(TEMPLATES[key]);
                }}
                className={`text-xs font-mono px-2.5 py-1 rounded-full border transition-colors ${
                  activeTemplate === key
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-primary hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={`border rounded-xl transition-all focus-within:ring-2 focus-within:ring-primary/15 ${
            charOver ? "border-red-300" : "border-gray-200 focus-within:border-primary/40"
          }`}>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setActiveTemplate(null);
              }}
              onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === "Enter" && handleGenerate()}
              placeholder={t('createContent.placeholder')}
              rows={5}
              className="w-full px-4 py-3 bg-transparent rounded-xl resize-none outline-none text-gray-900 placeholder-gray-400 text-sm leading-relaxed"
            />
            <div className="flex items-center justify-end px-4 pb-3">
              <span className={`text-xs font-mono ${
                charOver ? "text-red-500" : charWarn ? "text-amber-500" : "text-gray-500"
              }`}>
                {t('createContent.charLimit', { count: charCount })}
              </span>
            </div>
          </div>

          {/* Creativity */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-500 font-medium">{t('createContent.creativityLabel')}</p>
            <div className="grid grid-cols-3 gap-2">
              {CREATIVITY_LEVELS.map(({ id, label, emoji, desc }) => (
                <button
                  key={id}
                  onClick={() => setCreativity(id)}
                  className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-xs font-medium transition-all ${
                    creativity === id
                      ? "bg-primary/8 border-primary/30 text-primary shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl leading-none">{emoji}</span>
                  <span className="font-semibold">{label}</span>
                  <span className={`text-center leading-tight ${creativity === id ? "text-primary/70" : "text-gray-500"}`}>
                    {desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            loading={loading}
            className="w-full py-3"
          >
            {t('createContent.generate')}
          </Button>

          {!selectedPlatform && text.trim() && (
            <p className="text-xs text-amber-500 text-center -mt-2">
              {t('createContent.selectPlatformWarning')}
            </p>
          )}
          {!selectedClientId && text.trim() && (
            <p className="text-xs text-amber-500 text-center -mt-2">
              {t('createContent.selectClientWarning')}
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
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('createContent.step3')}
              </p>
              <button
                onClick={handleReset}
                className="text-xs text-gray-500 hover:text-gray-600 transition-colors"
              >
                {t('createContent.startOver')}
              </button>
            </div>

            {saved && selected && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-600">
                <Check className="w-3.5 h-3.5" />
                {t('createContent.savedToHistory', { name: selectedClient?.client_name || 'history' })}
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