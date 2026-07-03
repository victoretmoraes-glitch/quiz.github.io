"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Zap,
  Circle,
  Candy,
  Droplet,
  Moon,
  Sofa,
  X,
  Activity,
  Target,
  Flag,
} from "lucide-react";

const Icons = {
  ChevronLeft,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Zap,
  Circle,
  Candy,
  Droplet,
  Moon,
  Sofa,
  X,
  Activity,
  Target,
  Flag,
};
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import quizConfigDefault from "@/lib/quiz/quizConfig.json";
import { useQuizStore } from "@/lib/quiz/store";
import {
  interpolate,
  evaluateTransitions,
  runActions,
  buildRedirectUrl,
} from "@/lib/quiz/engine";

/* ================================================================== */
/*                            HELPERS                                 */
/* ================================================================== */

function Icon({ name, className }) {
  const C = Icons[name] || Icons.Circle;
  return <C className={className} />;
}

function useScope() {
  const variables = useQuizStore((s) => s.variables);
  const tracking = useQuizStore((s) => s.tracking);
  return { ...variables, tracking };
}

function StepShell({ step, scope, totalSteps, currentIndex, children, onBack }) {
  const progressPct = Math.round(((currentIndex + 1) / totalSteps) * 100);
  return (
    <div className="w-full max-w-2xl mx-auto">
      {step.showProgressBar !== false && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <button
              onClick={onBack}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 hover:text-foreground disabled:opacity-30 transition"
            >
              <Icons.ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <span>
              {currentIndex + 1} de {totalSteps}
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      )}

      {step.title && (
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-center mb-2">
          {interpolate(step.title, scope)}
        </h1>
      )}
      {step.subtitle && (
        <p className="text-center text-muted-foreground mb-8 text-base md:text-lg">
          {interpolate(step.subtitle, scope)}
        </p>
      )}

      {children}
    </div>
  );
}

/* ================================================================== */
/*                       STEP COMPONENTS                              */
/* ================================================================== */

function ImageGridStep({ step, scope, onAdvance }) {
  const setVariable = useQuizStore((s) => s.setVariable);
  const [selected, setSelected] = useState(scope[step.variableKey] || null);
  const cols = step.columns || 2;
  const gridCls =
    cols === 4 ? "grid-cols-2 md:grid-cols-4" : cols === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2";

  const handlePick = (opt) => {
    setSelected(opt.value);
    setVariable(step.variableKey, opt.value);
    if (step.autoAdvance) {
      setTimeout(() => onAdvance(opt.nextStepId), 250);
    }
  };

  return (
    <>
      <div className={`grid ${gridCls} gap-3 md:gap-4`}>
        {step.options.map((opt) => {
          const isSel = selected === opt.value;
          return (
            <motion.button
              key={opt.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePick(opt)}
              className={`group relative overflow-hidden rounded-2xl border-2 transition-all ${
                isSel
                  ? "border-primary ring-4 ring-primary/20 shadow-lg shadow-primary/20"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {opt.imageUrl && (
                <div className="aspect-square w-full overflow-hidden bg-muted">
                  <img
                    src={opt.imageUrl}
                    alt={opt.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-3 bg-card text-left">
                <div className="font-semibold text-sm md:text-base">{opt.label}</div>
                {opt.description && (
                  <div className="text-xs text-muted-foreground mt-1">{opt.description}</div>
                )}
              </div>
              {isSel && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Icons.Check className="h-4 w-4" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {!step.autoAdvance && (
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            disabled={!selected}
            onClick={() => onAdvance()}
            className="min-w-[240px]"
          >
            {step.ctaLabel || "Continuar"}
          </Button>
        </div>
      )}
    </>
  );
}

function ListSingleStep({ step, scope, onAdvance }) {
  const setVariable = useQuizStore((s) => s.setVariable);
  const [selected, setSelected] = useState(scope[step.variableKey] || null);

  const handlePick = (opt) => {
    setSelected(opt.value);
    setVariable(step.variableKey, opt.value);
    if (step.autoAdvance) setTimeout(() => onAdvance(opt.nextStepId), 200);
  };

  return (
    <>
      <div className="space-y-3">
        {step.options.map((opt) => {
          const isSel = selected === opt.value;
          return (
            <motion.button
              key={opt.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePick(opt)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                isSel
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-card"
              }`}
            >
              {opt.iconName && (
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon name={opt.iconName} className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium">{opt.label}</div>
                {opt.description && (
                  <div className="text-sm text-muted-foreground">{opt.description}</div>
                )}
              </div>
              {isSel && <Icons.CheckCircle2 className="h-6 w-6 text-primary" />}
            </motion.button>
          );
        })}
      </div>

      {!step.autoAdvance && (
        <div className="mt-8 flex justify-center">
          <Button size="lg" disabled={!selected} onClick={() => onAdvance()} className="min-w-[240px]">
            {step.ctaLabel || "Continuar"}
          </Button>
        </div>
      )}
    </>
  );
}

function ListMultipleStep({ step, scope, onAdvance }) {
  const setVariable = useQuizStore((s) => s.setVariable);
  const initial = Array.isArray(scope[step.variableKey]) ? scope[step.variableKey] : [];
  const [selected, setSelected] = useState(initial);

  const toggle = (opt) => {
    const isExclusive = opt.exclusive;
    let next;
    if (isExclusive) {
      // toggle exclusive: if already only this selected -> clear; else set only this
      next = selected.includes(opt.value) ? [] : [opt.value];
    } else {
      // remove any exclusive selection first
      const exclusiveValues = step.options.filter((o) => o.exclusive).map((o) => o.value);
      const cleaned = selected.filter((v) => !exclusiveValues.includes(v));
      next = cleaned.includes(opt.value)
        ? cleaned.filter((v) => v !== opt.value)
        : [...cleaned, opt.value];
    }
    setSelected(next);
    setVariable(step.variableKey, next);
  };

  const min = step.minSelections ?? 0;
  const canContinue = selected.length >= min;

  return (
    <>
      <div className="space-y-3">
        {step.options.map((opt) => {
          const isSel = selected.includes(opt.value);
          return (
            <motion.button
              key={opt.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggle(opt)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                isSel ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 bg-card"
              }`}
            >
              <Checkbox checked={isSel} className="pointer-events-none" />
              {opt.iconName && (
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon name={opt.iconName} className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1 font-medium">{opt.label}</div>
              {opt.exclusive && (
                <Badge variant="outline" className="text-[10px]">exclusiva</Badge>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Button size="lg" disabled={!canContinue} onClick={() => onAdvance()} className="min-w-[240px]">
          {step.ctaLabel || "Continuar"}
        </Button>
      </div>
    </>
  );
}

function InputTextStep({ step, scope, onAdvance }) {
  const setVariable = useQuizStore((s) => s.setVariable);
  const [values, setValues] = useState(() => {
    const v = {};
    step.fields.forEach((f) => (v[f.variableKey] = scope[f.variableKey] || ""));
    return v;
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    step.fields.forEach((f) => {
      const val = values[f.variableKey];
      if (f.required && !val) errs[f.variableKey] = f.errorMessage || "Campo obrigatório";
      else if (f.minLength && val && val.length < f.minLength)
        errs[f.variableKey] = f.errorMessage || `Mínimo ${f.minLength} caracteres`;
      else if (f.pattern && val && !new RegExp(f.pattern).test(val))
        errs[f.variableKey] = f.errorMessage || "Valor inválido";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    step.fields.forEach((f) => setVariable(f.variableKey, values[f.variableKey]));
    onAdvance();
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {step.fields.map((f) => (
          <div key={f.variableKey} className="space-y-2">
            <Label htmlFor={f.variableKey}>{f.label}</Label>
            <Input
              id={f.variableKey}
              type={f.inputType || "text"}
              placeholder={f.placeholder}
              value={values[f.variableKey]}
              onChange={(e) => setValues((v) => ({ ...v, [f.variableKey]: e.target.value }))}
              className="text-lg h-12"
            />
            {errors[f.variableKey] && (
              <p className="text-xs text-destructive">{errors[f.variableKey]}</p>
            )}
          </div>
        ))}
        <Button size="lg" onClick={submit} className="w-full mt-4">
          {step.ctaLabel || "Continuar"}
        </Button>
      </CardContent>
    </Card>
  );
}

function InputNumberStep({ step, scope, onAdvance }) {
  const setVariable = useQuizStore((s) => s.setVariable);
  const [values, setValues] = useState(() => {
    const v = {};
    step.fields.forEach((f) => (v[f.variableKey] = scope[f.variableKey] ?? ""));
    return v;
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    step.fields.forEach((f) => {
      const val = Number(values[f.variableKey]);
      if (f.required && !values[f.variableKey])
        errs[f.variableKey] = f.errorMessage || "Campo obrigatório";
      else if (!Number.isNaN(val)) {
        if (f.min !== undefined && val < f.min)
          errs[f.variableKey] = f.errorMessage || `Mínimo ${f.min}`;
        if (f.max !== undefined && val > f.max)
          errs[f.variableKey] = f.errorMessage || `Máximo ${f.max}`;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    step.fields.forEach((f) => setVariable(f.variableKey, Number(values[f.variableKey])));
    onAdvance();
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {step.fields.map((f) => (
          <div key={f.variableKey} className="space-y-2">
            <Label htmlFor={f.variableKey}>{f.label}</Label>
            <div className="relative">
              <Input
                id={f.variableKey}
                type="number"
                inputMode="decimal"
                placeholder={f.placeholder}
                value={values[f.variableKey]}
                min={f.min}
                max={f.max}
                step={f.step}
                onChange={(e) => setValues((v) => ({ ...v, [f.variableKey]: e.target.value }))}
                className="text-lg h-12 pr-14"
              />
              {f.unit && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  {f.unit}
                </span>
              )}
            </div>
            {errors[f.variableKey] && (
              <p className="text-xs text-destructive">{errors[f.variableKey]}</p>
            )}
          </div>
        ))}
        <Button size="lg" onClick={submit} className="w-full mt-4">
          {step.ctaLabel || "Continuar"}
        </Button>
      </CardContent>
    </Card>
  );
}

function InterstitialStep({ step, scope, onAdvance }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = step.loadingMessages || [];

  useEffect(() => {
    if (!messages.length) return;
    const perMsg = Math.max(600, (step.autoAdvanceMs || 3000) / messages.length);
    const timer = setInterval(() => {
      setMsgIdx((i) => (i + 1 < messages.length ? i + 1 : i));
    }, perMsg);
    return () => clearInterval(timer);
  }, [messages.length, step.autoAdvanceMs]);

  useEffect(() => {
    if (step.autoAdvanceMs) {
      const t = setTimeout(() => onAdvance(), step.autoAdvanceMs);
      return () => clearTimeout(t);
    }
  }, [step.autoAdvanceMs, onAdvance]);

  return (
    <Card>
      <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
          <div className="relative h-20 w-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Icons.Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-lg font-medium mb-6 min-h-[28px]"
          >
            {interpolate(messages[msgIdx] || "", scope)}
          </motion.p>
        </AnimatePresence>

        {step.socialProof && (
          <div className="mt-4 flex items-center gap-3 bg-muted/50 rounded-full pl-2 pr-4 py-2">
            <div className="flex -space-x-2">
              {(step.socialProof.avatars || []).slice(0, 3).map((a, i) => (
                <img
                  key={i}
                  src={a}
                  alt=""
                  className="h-8 w-8 rounded-full border-2 border-background object-cover"
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{step.socialProof.text}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ResultStep({ step, scope, onAdvance }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-orange-400" />
      <CardContent className="pt-8 space-y-6">
        {step.headline && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Icons.Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Seu resultado
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">{interpolate(step.headline, scope)}</h2>
          </div>
        )}

        {step.highlights && step.highlights.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {step.highlights.map((h, i) => (
              <div
                key={i}
                className="rounded-xl border bg-card p-3 text-center"
              >
                {h.icon && (
                  <div className="inline-flex h-8 w-8 rounded-full bg-primary/10 items-center justify-center mb-2">
                    <Icon name={h.icon} className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="text-xs text-muted-foreground">{h.label}</div>
                <div className="font-bold text-sm md:text-base capitalize">
                  {interpolate(h.value, scope)}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-base md:text-lg leading-relaxed text-muted-foreground">
          {interpolate(step.body, scope)}
        </p>

        <Button size="lg" onClick={() => onAdvance()} className="w-full">
          {step.ctaLabel || "Continuar"}
          <Icons.ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function CheckoutRedirectStep({ step, scope }) {
  const finalUrl = useMemo(() => buildRedirectUrl(step, scope), [step, scope]);
  const [countdown, setCountdown] = useState(
    step.autoRedirectMs ? Math.ceil(step.autoRedirectMs / 1000) : null
  );

  useEffect(() => {
    if (!step.autoRedirectMs) return;
    const t = setTimeout(() => {
      if (step.openInNewTab) window.open(finalUrl, "_blank");
      else window.location.href = finalUrl;
    }, step.autoRedirectMs);
    const c = setInterval(() => setCountdown((n) => (n && n > 0 ? n - 1 : 0)), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(c);
    };
  }, [finalUrl, step.autoRedirectMs, step.openInNewTab]);

  return (
    <Card>
      <CardContent className="pt-8 text-center">
        <div className="relative mb-6 inline-flex">
          <div className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl animate-pulse" />
          <div className="relative h-20 w-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <Icons.CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
        </div>

        {step.title && (
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {interpolate(step.title, scope)}
          </h2>
        )}
        {step.subtitle && (
          <p className="text-muted-foreground mb-6">{interpolate(step.subtitle, scope)}</p>
        )}

        {countdown !== null && countdown > 0 && (
          <p className="text-sm text-muted-foreground mb-6">
            Redirecionando em <span className="font-bold text-foreground">{countdown}s</span>...
          </p>
        )}

        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            if (step.openInNewTab) window.open(finalUrl, "_blank");
            else window.location.href = finalUrl;
          }}
        >
          {step.buttonLabel || "Ir para meu plano agora"}
          <Icons.ExternalLink className="ml-2 h-4 w-4" />
        </Button>

        <div className="mt-6 p-3 rounded-lg bg-muted/50 text-left">
          <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1">
            URL de destino (debug)
          </div>
          <code className="text-xs break-all text-foreground/80">{finalUrl}</code>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*                          MAIN QUIZ APP                             */
/* ================================================================== */

function App({ quizId }) {
  const [config, setConfig] = useState(null);

  // Load config from API (fallback to bundled default)
  useEffect(() => {
    let ignore = false;
    const url = quizId ? `/api/quizzes/${quizId}` : "/api/quiz-config";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (ignore) return;
        setConfig(data?.config || quizConfigDefault);
      })
      .catch(() => setConfig(quizConfigDefault));
    return () => {
      ignore = true;
    };
  }, [quizId]);

  const {
    currentStepId,
    init,
    goToStep,
    back,
    setVariables,
    variables,
    tracking,
  } = useQuizStore();

  const initedRef = useRef(false);
  const enteredRef = useRef(new Set());

  // 1) Init on mount — capture URL params, set startStepId
  useEffect(() => {
    if (!config) return;
    if (initedRef.current) return;
    initedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    init(config, params);
  }, [config, init]);

  const stepsById = useMemo(() => {
    const map = {};
    (config?.steps || []).forEach((s) => (map[s.id] = s));
    return map;
  }, [config]);

  const currentStep = currentStepId ? stepsById[currentStepId] : null;
  const currentIndex = currentStep ? (config?.steps || []).findIndex((s) => s.id === currentStep.id) : 0;
  const totalSteps = (config?.steps || []).length;
  const scope = { ...variables, tracking };

  // 2) Run onEnter actions when step changes
  useEffect(() => {
    if (!currentStep) return;
    if (enteredRef.current.has(currentStep.id)) return;
    enteredRef.current.add(currentStep.id);

    runActions(currentStep.onEnter, {
      getVars: () => useQuizStore.getState().variables,
      getTracking: () => useQuizStore.getState().tracking,
      setVars: (patch) => setVariables(patch),
      track: (eventName, payload) => {
        // eslint-disable-next-line no-console
        console.log("[track]", eventName, payload);
      },
    });
  }, [currentStep, setVariables]);

  const handleAdvance = (overrideNextId) => {
    if (!currentStep) return;
    // onExit
    runActions(currentStep.onExit, {
      getVars: () => useQuizStore.getState().variables,
      getTracking: () => useQuizStore.getState().tracking,
      setVars: (patch) => setVariables(patch),
      track: (eventName, payload) => {
        // eslint-disable-next-line no-console
        console.log("[track]", eventName, payload);
        if (eventName === "Lead") toast.success("Lead capturado com sucesso!");
      },
    });

    // evaluate transitions
    const currentScope = {
      ...useQuizStore.getState().variables,
      tracking: useQuizStore.getState().tracking,
    };
    const rule = evaluateTransitions(currentStep, currentScope);
    const nextId = overrideNextId || rule?.goToStepId || currentStep.nextStepId;
    if (!nextId) return;
    goToStep(nextId, totalSteps);
  };

  if (!config || !currentStep) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stepComponent = (() => {
    switch (currentStep.type) {
      case "image-grid":
        return <ImageGridStep step={currentStep} scope={scope} onAdvance={handleAdvance} />;
      case "list-single":
        return <ListSingleStep step={currentStep} scope={scope} onAdvance={handleAdvance} />;
      case "list-multiple":
        return <ListMultipleStep step={currentStep} scope={scope} onAdvance={handleAdvance} />;
      case "input-text":
        return <InputTextStep step={currentStep} scope={scope} onAdvance={handleAdvance} />;
      case "input-number":
        return <InputNumberStep step={currentStep} scope={scope} onAdvance={handleAdvance} />;
      case "interstitial":
        return <InterstitialStep step={currentStep} scope={scope} onAdvance={handleAdvance} />;
      case "result":
        return <ResultStep step={currentStep} scope={scope} onAdvance={handleAdvance} />;
      case "checkout-redirect":
        return <CheckoutRedirectStep step={currentStep} scope={scope} />;
      default:
        return (
          <div className="text-center text-muted-foreground">
            Tipo de step desconhecido: {currentStep.type}
          </div>
        );
    }
  })();

  return (
    <main className="min-h-screen w-full relative overflow-hidden">
      {/* background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-background">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Brand header */}
        <header className="mb-8 flex items-center justify-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 grid place-items-center">
            <Icons.Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">{config.meta.name}</span>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
          >
            <StepShell
              step={currentStep}
              scope={scope}
              totalSteps={totalSteps}
              currentIndex={currentIndex}
              onBack={back}
            >
              {stepComponent}
            </StepShell>
          </motion.div>
        </AnimatePresence>

        {/* Footer tracking debug (small) */}
        {Object.keys(tracking).length > 0 && (
          <div className="mt-10 mx-auto max-w-2xl text-[10px] text-muted-foreground/60 text-center">
            tracking: {Object.entries(tracking).map(([k, v]) => `${k}=${v}`).join(" · ")}
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
