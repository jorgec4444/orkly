import { useState, useEffect } from "react";
import { Check, Zap, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { plansConfig } from "../config/plans";
import AuthModal from "../components/AuthModal";
import { supabase } from "../supabase";
import { toast } from "react-hot-toast";

const yearlySaving = (plan) => {
  if (plan.monthly === 0) return null;
  return plan.monthly * 12 - plan.yearly;
};

export default function Pricing() {
  const [billing, setBilling] = useState("monthly");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });
  }, []);

  const plans = plansConfig.map((plan) => ({
    ...plan,
    name:        t(`pricing.plans.${plan.id}.name`),
    description: t(`pricing.plans.${plan.id}.description`),
    cta:         t(`pricing.plans.${plan.id}.cta`),
    badge:       plan.badge ? t(`pricing.plans.${plan.id}.badge`) : null,
    features:    t(`pricing.plans.${plan.id}.features`, { returnObjects: true }),
  }));

  const handleCta = (planId) => {
    if (planId === "free") {
      // Free plan — open auth modal or go to dashboard
      if (!isAuthenticated) {
        setIsAuthModalOpen(true);
      } else {
        navigate("/dashboard");
      }
      return;
    }

    // Paid plans — coming soon
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
    } else {
      // TODO: replace with Stripe checkout when ready
      toast(t("pricing.comingSoon"), { icon: "🚀", duration: 3000 });
    }
  };

  const reassuranceItems = [
    {
      icon: t("pricing.reassurance.noCard.icon"),
      title: t("pricing.reassurance.noCard.title"),
      desc: t("pricing.reassurance.noCard.desc"),
    },
    {
      icon: t("pricing.reassurance.cancel.icon"),
      title: t("pricing.reassurance.cancel.title"),
      desc: t("pricing.reassurance.cancel.desc"),
    },
    {
      icon: t("pricing.reassurance.instant.icon"),
      title: t("pricing.reassurance.instant.title"),
      desc: t("pricing.reassurance.instant.desc"),
    },
  ];

  return (
    <div className="min-h-screen bg-bg font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5"
          >
            <img src="/favicon.svg" alt="Orkly" className="w-9 h-9" />
            <span className="font-bold text-gray-900 tracking-tight">Orkly</span>
          </button>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-500 hover:text-primary transition-colors"
          >
            {t("pricing.back")}
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16">

        {/* ── Header ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/8 px-3.5 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {t("pricing.badge")}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
            {t("pricing.title1")}<br />
            <span className="text-primary">{t("pricing.title2")}</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-md mx-auto">
            {t("pricing.subtitle")}
          </p>
        </div>

        {/* ── Billing toggle ── */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-medium transition-colors ${billing === "monthly" ? "text-gray-900" : "text-gray-400"}`}>
            {t("pricing.monthly")}
          </span>
          <button
            role="switch"
            aria-checked={billing === "yearly"}
            onClick={() => setBilling(b => b === "monthly" ? "yearly" : "monthly")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
              billing === "yearly" ? "bg-primary" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                billing === "yearly" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${billing === "yearly" ? "text-gray-900" : "text-gray-400"}`}>
            {t("pricing.yearly")}
          </span>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {t("pricing.saveBadge")}
          </span>
        </div>

        {/* ── Plans grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const monthlyEquiv = billing === "yearly" && plan.yearly > 0
              ? (plan.yearly / 12).toFixed(1)
              : plan.monthly;
            const saving = yearlySaving(plan);

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                  plan.highlight
                    ? "bg-primary border-primary shadow-xl shadow-primary/15 scale-[1.02]"
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 bg-white text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/20 shadow-sm">
                      <Zap className="w-3 h-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan name & price */}
                <div className="mb-4 min-h-[88px]">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${plan.highlight ? "text-white/70" : "text-gray-400"}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1 mb-1">
                    {plan.monthly === 0 ? (
                      <span className={`text-4xl font-extrabold tracking-tight ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                        {plan.name}
                      </span>
                    ) : (
                      <>
                        <span className={`text-4xl font-extrabold tracking-tight ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                          €{billing === "yearly" ? monthlyEquiv : plan.monthly}
                        </span>
                        <span className={`text-sm mb-1 ${plan.highlight ? "text-white/60" : "text-gray-400"}`}>
                          {t("pricing.perMonth")}
                        </span>
                      </>
                    )}
                  </div>
                  {billing === "yearly" && saving && (
                    <p className={`text-xs font-medium ${plan.highlight ? "text-white/70" : "text-primary"}`}>
                      {t("pricing.savedVsMonthly", { amount: saving })}
                    </p>
                  )}
                  {billing === "monthly" && plan.monthly > 0 && (
                    <p className={`text-xs ${plan.highlight ? "text-white/50" : "text-gray-400"}`}>
                      {t("pricing.orBilledYearly", { amount: (plan.yearly / 12).toFixed(1) })}
                    </p>
                  )}
                </div>

                <p className={`text-sm leading-relaxed mb-5 min-h-[40px] ${plan.highlight ? "text-white/80" : "text-gray-500"}`}>
                  {plan.description}
                </p>

                {/* CTA */}
                <button
                  onClick={() => handleCta(plan.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all mb-6 ${
                    plan.highlight
                      ? "bg-white text-primary hover:bg-white/90"
                      : plan.ctaVariant === "primary"
                        ? "bg-primary text-white hover:opacity-90"
                        : "border border-gray-200 text-gray-700 hover:border-primary hover:text-primary"
                  }`}
                >
                  <span className="w-3.5" />
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                </button>

                {/* Divider */}
                <div className={`h-px mb-5 ${plan.highlight ? "bg-white/15" : "bg-gray-100"}`} />

                {/* Features */}
                <ul className="flex flex-col gap-2.5">
                  {plan.features.map((feature) => {
                    const isComingSoon = feature.startsWith("*");
                    const label = isComingSoon ? feature.slice(1) : feature;

                    return (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          isComingSoon
                            ? plan.highlight ? "text-white/30" : "text-gray-300"
                            : plan.highlight ? "text-white" : "text-primary"
                        }`} />
                        <span className={`flex items-center gap-1.5 flex-wrap ${
                          plan.highlight
                            ? isComingSoon ? "text-white/50" : "text-white/90"
                            : isComingSoon ? "text-gray-400" : "text-gray-600"
                        }`}>
                          {label}
                          {isComingSoon && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              plan.highlight
                                ? "bg-white/10 text-white/60"
                                : "bg-gray-100 text-gray-400"
                            }`}>
                              {t("pricing.comingSoon")}
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* ── Reassurance ── */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {reassuranceItems.map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col flex-1 items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </div>

      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
