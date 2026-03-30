import { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import AuthModal from "../components/AuthModal";
import Footer from "../components/Footer";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const STYLE_COLORS = {
  professional: "bg-blue-50 text-blue-700 border-blue-200",
  casual: "bg-amber-50 text-amber-700 border-amber-200",
  viral: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function Landing() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [text, setText] = useState("");
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState(null);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, []);

  const TEMPLATES = useMemo(() => ({
    launch: t('templates.launch'),
    milestone: t('templates.milestone'),
    lesson: t('templates.lesson'),
    announcement: t('templates.announcement'),
    question: t('templates.question'),
  }), [t]);

  const TEMPLATE_LABELS = useMemo(() => ({
    launch: t('createContent.templateLabels.launch'),
    milestone: t('createContent.templateLabels.milestone'),
    lesson: t('createContent.templateLabels.lesson'),
    announcement: t('createContent.templateLabels.announcement'),
    question: t('createContent.templateLabels.question'),
  }), [t]);

  const STYLE_META = useMemo(() => ({
    professional: { label: t('createContent.styleMeta.professional.label'), desc: t('createContent.styleMeta.professional.desc') },
    casual: { label: t('createContent.styleMeta.casual.label'), desc: t('createContent.styleMeta.casual.desc') },
    viral: { label: t('createContent.styleMeta.viral.label'), desc: t('createContent.styleMeta.viral.desc') },
  }), [t]);

  useEffect(() => {
    if (activeTemplate) {
      setText(TEMPLATES[activeTemplate]);
    } else {
      setText("");
      setVariations(null);
      setSelected(null);
    }
  }, [i18n.language]);

  const charCount = text.length;
  const charOver = charCount > 500;
  const charWarn = charCount > 400 && !charOver;

  const handleImprove = async () => {
    if (!text.trim() || charOver) return;
    setLoading(true);
    setVariations(null);
    setSelected(null);
    try {
      const res = await fetch(`${API_BASE}/text-generation/improve-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();
      setVariations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (style, txt) => {
    await navigator.clipboard.writeText(txt);
    setCopied(style);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-bg font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/favicon.svg" alt="Orkly" className="w-9 h-9" />
            <span className="font-bold text-gray-900 tracking-tight">Orkly</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <LanguageSelector variant="light" />
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 sm:px-4 py-1.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors whitespace-nowrap"
            >
              {t('nav.signIn')}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 flex-1 w-full">

        {/* ── Hero ── */}
        <section className="pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/8 px-3.5 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {t('hero.badge')}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
            {t('hero.title1')}<br />
            <span className="text-primary">{t('hero.title2')}</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 flex-wrap">
            <span>{t('hero.builtFor')}</span>
            {["Instagram", "Twitter / X", "LinkedIn"].map((p) => (
              <span key={p} className="px-2.5 py-1 rounded-full border border-gray-200 bg-white text-gray-600">
                {p}
              </span>
            ))}
          </div>
        </section>

        {/* ── Compose ── */}
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
            {t('compose.label')}
          </p>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setActiveTemplate(null);
              }}
              onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === "Enter" && handleImprove()}
              placeholder={t('compose.placeholder')}
              maxLength={600}
              rows={5}
              className="w-full bg-transparent resize-none outline-none text-gray-900 placeholder-gray-400 text-[15px] leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className={`text-xs font-mono ${charOver ? "text-red-500" : charWarn ? "text-amber-500" : "text-gray-500"}`}>
                {t('compose.charLimit', { count: charCount })}
              </span>
              <button
                onClick={handleImprove}
                disabled={!text.trim() || charOver || loading}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    {t('compose.generating')}
                  </>
                ) : (
                  t('compose.improve')
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Templates ── */}
        <div className="flex items-center gap-2 flex-wrap mb-10">
          <span className="text-xs font-mono text-gray-500 mr-1">{t('templates.label')}</span>
          {Object.entries(TEMPLATE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setActiveTemplate(key);
                setText(TEMPLATES[key]);
              }}
              className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-colors ${
                activeTemplate === key
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center gap-4 py-8 text-gray-600 text-sm">
            <span className="w-5 h-5 border-2 border-gray-200 border-t-primary rounded-full animate-spin flex-shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: t('loading.generating') }} />
          </div>
        )}

        {/* ── Variations ── */}
        {variations && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                {t('variations.label')}
              </p>
              {variations.original && (
                <p className="text-xs text-gray-500 truncate max-w-xs">
                  "{variations.original.slice(0, 50)}{variations.original.length > 50 ? "…" : ""}"
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {variations.variations?.map(({ version, text: varText }) => (
                <div
                  key={version}
                  onClick={() => setSelected(version)}
                  className={`bg-white border rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-md ${
                    selected === version
                      ? "border-primary ring-2 ring-primary/15 shadow-md"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STYLE_COLORS[version]}`}>
                        {STYLE_META[version]?.label}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{STYLE_META[version]?.desc}</p>
                    </div>
                    {selected === version && (
                      <span className="text-primary text-sm flex-shrink-0">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">{varText}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCopy(version, varText); }}
                    className="self-end text-xs text-gray-500 hover:text-primary transition-colors"
                  >
                    {copied === version ? t('variations.copied') : t('variations.copy')}
                  </button>
                </div>
              ))}
            </div>

            {/* CTA to sign in */}
            <div className="mt-6 mb-10 bg-gradient-to-r from-primary/8 to-accent/10 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{t('cta.title')}</p>
                <p className="text-xs text-gray-600 mt-0.5">{t('cta.subtitle')}</p>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:w-auto flex-shrink-0 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors"
              >
                {t('cta.button')}
              </button>
            </div>
          </div>
        )}
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <Footer />
    </div>
  );
}