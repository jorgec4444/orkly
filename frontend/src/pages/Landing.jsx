// Copyright © 2026 Jorge Vinagre
// SPDX-License-Identifier: AGPL-3.0-only WITH Commons-Clause
import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import AuthModal from "../components/AuthModal";
import Footer from "../components/Footer";
import Button from "../components/Button";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";
import { apiFetch } from "../utils/apiFetch";
import { Sparkles, Users, FolderOpen, Zap, Check } from "lucide-react";

const STYLE_COLORS = {
  professional: "bg-blue-50 text-blue-700 border-blue-200",
  casual: "bg-amber-50 text-amber-700 border-amber-200",
  viral: "bg-rose-50 text-rose-700 border-rose-200",
};

// ── Dot grid background ────────────────────────────────────────────────────
function DotGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        backgroundImage: "radial-gradient(circle, #0F6E5618 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />
  );
}

// ── Squirrel mark ──────────────────────────────────────────────────────────
function SquirrelMark({ className = "", floating = false }) {
  return (
    <img
      src="/favicon.svg"
      alt="Orkly"
      className={className}
      style={{
        borderRadius: "35%",
        ...(floating && { animation: "squirrelFloat 3s ease-in-out infinite" }),
      }}
    />
  );
}

// ── Feature bento card ─────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, accent = false, className = "" }) {
  return (
    <div
      className={`relative rounded-2xl p-6 flex flex-col gap-3 border transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        accent
          ? "bg-primary text-white border-primary shadow-md"
          : "bg-white border-gray-200 text-gray-900"
      } ${className}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ? "bg-white/15" : "bg-primary/8"}`}>
        <Icon className={`w-5 h-5 ${accent ? "text-white" : "text-primary"}`} />
      </div>
      <div>
        <p className={`font-semibold text-sm ${accent ? "text-white" : "text-gray-900"}`}>{title}</p>
        <p className={`text-xs mt-1 leading-relaxed ${accent ? "text-white/70" : "text-gray-500"}`}>{desc}</p>
      </div>
    </div>
  );
}

// ── How it works step ──────────────────────────────────────────────────────
function Step({ number, title, desc }) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0 relative z-10">
        {number}
      </div>
      <div>
        <p className="font-semibold text-sm text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-[180px] mx-auto">{desc}</p>
      </div>
    </div>
  );
}

// ── Variation card (same as CreateContent but copy-only) ───────────────────
function VariationCard({ version, text, onCopy, copied, styleMeta }) {
  const { t } = useTranslation();
  const colorClass = STYLE_COLORS[version] || "bg-gray-50 text-gray-600 border-gray-200";
  const meta = styleMeta[version] || { label: version, desc: "" };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-all">
      <div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
          {meta.label}
        </span>
        <p className="text-xs text-gray-500 mt-1">{meta.desc}</p>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed flex-1">{text}</p>
      <button
        onClick={() => onCopy(version, text)}
        className="self-end text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/8 text-primary hover:bg-primary/15 transition-all"
      >
        {copied === version ? t("variations.copied") : t("variations.copy")}
      </button>
    </div>
  );
}

export default function Landing() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [text, setText] = useState("");
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState(null);
  const [copied, setCopied] = useState(null);
  const variationsRef = useRef(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, []);

  const TEMPLATES = useMemo(() => ({
    launch: t("templates.launch"),
    milestone: t("templates.milestone"),
    lesson: t("templates.lesson"),
    announcement: t("templates.announcement"),
    question: t("templates.question"),
  }), [t]);

  const TEMPLATE_LABELS = useMemo(() => ({
    launch: t("createContent.templateLabels.launch"),
    milestone: t("createContent.templateLabels.milestone"),
    lesson: t("createContent.templateLabels.lesson"),
    announcement: t("createContent.templateLabels.announcement"),
    question: t("createContent.templateLabels.question"),
  }), [t]);

  const STYLE_META = useMemo(() => ({
    professional: {
      label: t("createContent.styleMeta.professional.label"),
      desc: t("createContent.styleMeta.professional.desc"),
    },
    casual: {
      label: t("createContent.styleMeta.casual.label"),
      desc: t("createContent.styleMeta.casual.desc"),
    },
    viral: {
      label: t("createContent.styleMeta.viral.label"),
      desc: t("createContent.styleMeta.viral.desc"),
    },
  }), [t]);

  useEffect(() => {
    if (!activeTemplate) {
      setText("");
      setVariations(null);
    }
  }, [i18n.language]);

  // Auto-scroll to variations when they appear
  useEffect(() => {
    if (variations && variationsRef.current) {
      setTimeout(() => {
        variationsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [variations]);

  const charCount = text.length;
  const charOver = charCount > 500;
  const charWarn = charCount > 400 && !charOver;

  const handleImprove = async () => {
    if (!text.trim() || charOver) return;
    setLoading(true);
    setVariations(null);
    try {
      const data = await apiFetch("/text-generation/improve-text", {
        method: "POST",
        body: JSON.stringify({ text: text.trim() }),
      });
      setVariations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (version, txt) => {
    await navigator.clipboard.writeText(txt);
    setCopied(version);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-bg font-sans relative">

      {/* ── Global dot grid ── */}
      <DotGrid />

      {/* ── Floating squirrel keyframe ── */}
      <style>{`
        @keyframes squirrelFloat {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50%       { transform: translateY(-12px) rotate(3deg); }
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-bg/90 backdrop-blur-md border-b border-gray-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/favicon.svg" alt="Orkly" style={{ borderRadius: "35%", width: "2.25rem", height: "2.25rem" }} />
            <span className="font-bold text-gray-900 tracking-tight text-base">Orkly</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <LanguageSelector variant="light" />
            <Button size="sm" onClick={() => setIsAuthModalOpen(true)}>
              {t("nav.signIn")}
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden z-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="w-[600px] h-[400px] rounded-full bg-primary/6 blur-3xl -translate-y-1/4" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12">
          {/* Two-column layout on desktop: text left, squirrel right */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">

            {/* Left — text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/8 px-3.5 py-1.5 rounded-full mb-6 border border-primary/15">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                {t("hero.badge")}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-5">
                {t("hero.title1")}
                <br />
                <span className="text-primary">{t("hero.title2")}</span>
              </h1>

              <p className="text-lg text-gray-600 max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
                {t("hero.subtitle")}
              </p>

              <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap mb-8">
                <Button size="lg" onClick={() => setIsAuthModalOpen(true)} className="px-8">
                  {t("cta.button")}
                </Button>
                <a href="/pricing" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors px-4 py-3">
                  {t("footer.pricing")} →
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-gray-500 flex-wrap">
                <span>{t("hero.builtFor")}</span>
                {["Instagram", "LinkedIn", "Twitter / X", "TikTok", "YouTube", "Facebook"].map((p) => (
                  <span key={p} className="px-2.5 py-1 rounded-full border border-gray-200 bg-white text-gray-600 font-medium">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — floating squirrel (desktop only) */}
            <div className="hidden lg:flex flex-shrink-0 items-center justify-center w-48">
              <SquirrelMark
                floating
                className="w-32 h-32 drop-shadow-xl"
              />
            </div>

          </div>
        </div>
      </section>

      {/* ── Live demo ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            {t("compose.label")} — {t("landing.tryItFree") || "Try it free, no sign-up needed"}
          </p>
        </div>

        {/* Input box */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5">
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setActiveTemplate(null); }}
              onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === "Enter" && handleImprove()}
              placeholder={t("compose.placeholder")}
              maxLength={600}
              rows={4}
              aria-label={t("compose.placeholder")}
              className="w-full bg-transparent resize-none outline-none text-gray-900 placeholder-gray-400 text-[15px] leading-relaxed"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span
                className={`text-xs font-mono ${charOver ? "text-red-500" : charWarn ? "text-amber-500" : "text-gray-400"}`}
                aria-live="polite"
              >
                {t("compose.charLimit", { count: charCount })}
              </span>
              <Button
                onClick={handleImprove}
                disabled={!text.trim() || charOver}
                loading={loading}
                size="sm"
                className="px-5"
              >
                {t("compose.improve")}
              </Button>
            </div>
          </div>

          {/* Templates */}
          <div className="px-5 pb-4 flex items-center gap-2 flex-wrap border-t border-gray-50 pt-3">
            <span className="text-xs font-mono text-gray-400 mr-1">{t("templates.label")}</span>
            {Object.entries(TEMPLATE_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setActiveTemplate(key); setText(TEMPLATES[key]); }}
                className={`text-xs font-mono px-2.5 py-1 rounded-full border transition-colors ${
                  activeTemplate === key
                    ? "border-primary text-primary bg-primary/5"
                    : "border-gray-200 bg-gray-50 text-gray-500 hover:border-primary hover:text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 py-6 text-gray-500 text-sm justify-center">
            <span className="w-4 h-4 border-2 border-gray-200 border-t-primary rounded-full animate-spin flex-shrink-0" aria-hidden="true" />
            <span dangerouslySetInnerHTML={{ __html: t("loading.generating") }} />
          </div>
        )}

        {/* Variations */}
        {variations && (
          <div ref={variationsRef} className="flex flex-col gap-4 mt-6 scroll-mt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                {t("variations.label")}
              </p>
              {variations.original && (
                <p className="text-xs text-gray-400 truncate max-w-xs hidden sm:block">
                  "{variations.original.slice(0, 50)}{variations.original.length > 50 ? "…" : ""}"
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {variations.variations?.map(({ version, text: varText }) => (
                <VariationCard
                  key={version}
                  version={version}
                  text={varText}
                  onCopy={handleCopy}
                  copied={copied}
                  styleMeta={STYLE_META}
                />
              ))}
            </div>

            {/* CTA after variations */}
            <div className="mt-2 bg-gradient-to-r from-primary/8 to-accent/10 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{t("cta.title")}</p>
                <p className="text-xs text-gray-600 mt-0.5">{t("cta.subtitle")}</p>
              </div>
              <Button onClick={() => setIsAuthModalOpen(true)} className="w-full sm:w-auto flex-shrink-0">
                {t("cta.button")}
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* ── Features bento grid ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
            {t("landing.featuresLabel") || "Everything you need"}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("landing.featuresTitle") || "Built for community managers"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={Sparkles} accent
            title={t("landing.feature1Title") || "AI content generation"}
            desc={t("landing.feature1Desc") || "Generate 3 variations — professional, casual and viral — tuned to each client's brand voice."}
            className="sm:col-span-2 lg:col-span-1"
          />
          <FeatureCard
            icon={Users}
            title={t("landing.feature2Title") || "Client management"}
            desc={t("landing.feature2Desc") || "Organise every client with their own brand voice, active platforms and content history."}
          />
          <FeatureCard
            icon={FolderOpen}
            title={t("landing.feature3Title") || "File storage"}
            desc={t("landing.feature3Desc") || "Keep branding assets, photos and contracts organised per client — always within reach."}
          />
          <FeatureCard
            icon={Zap}
            title={t("landing.feature4Title") || "6 platforms supported"}
            desc={t("landing.feature4Desc") || "Instagram, LinkedIn, Twitter/X, TikTok, YouTube and Facebook — content adapted to each one."}
            className="sm:col-span-2 lg:col-span-2"
          />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 bg-white/80 backdrop-blur-sm border-y border-gray-100 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              {t("landing.howLabel") || "How it works"}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("landing.howTitle") || "From draft to publish-ready in seconds"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            <div aria-hidden="true" className="hidden sm:block absolute top-5 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px bg-gray-200 z-0" />
            <Step number="1" title={t("landing.step1Title") || "Add your client"} desc={t("landing.step1Desc") || "Create a client profile and define their brand voice in a few words."} />
            <Step number="2" title={t("landing.step2Title") || "Write your draft"} desc={t("landing.step2Desc") || "Paste your rough idea or use one of the templates to get started."} />
            <Step number="3" title={t("landing.step3Title") || "Get 3 AI variations"} desc={t("landing.step3Desc") || "Orkly generates professional, casual and viral versions — pick your favourite and copy."} />
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="bg-primary rounded-3xl px-8 py-14 relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          </div>
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              {t("landing.ctaTitle") || "Start managing your clients today"}
            </h2>
            <p className="text-white/70 text-sm mb-8 max-w-md mx-auto">
              {t("landing.ctaSubtitle") || "Free tier available. No credit card required."}
            </p>
            <Button onClick={() => setIsAuthModalOpen(true)} className="bg-white text-primary hover:bg-white/90 border-white px-10 py-3 text-sm font-bold">
              {t("cta.button")}
            </Button>
          </div>
        </div>
      </section>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <Footer />
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
