"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Save,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  RotateCcw,
  Loader2,
  Settings,
  ListTree,
  Code2,
  Eye,
  Variable,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import quizConfigDefault from "@/lib/quiz/quizConfig.json";

/* ================================================================= */
/*                             HELPERS                               */
/* ================================================================= */

const STEP_TYPES = [
  { value: "image-grid", label: "Grid de imagens" },
  { value: "list-single", label: "Lista - escolha única" },
  { value: "list-multiple", label: "Lista - múltipla escolha" },
  { value: "interstitial", label: "Interstitial (loading)" },
  { value: "input-text", label: "Input de texto (lead)" },
  { value: "input-number", label: "Input numérico" },
  { value: "result", label: "Resultado" },
  { value: "checkout-redirect", label: "Redirect checkout" },
];

const uid = (prefix = "step") =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

const emptyStepFor = (type) => {
  const base = {
    id: uid(),
    type,
    title: "Novo step",
    subtitle: "",
    showProgressBar: true,
    ctaLabel: "Continuar",
  };
  switch (type) {
    case "image-grid":
      return {
        ...base,
        variableKey: "resposta",
        columns: 2,
        autoAdvance: true,
        options: [
          { id: uid("opt"), label: "Opção 1", value: "op1", imageUrl: "" },
          { id: uid("opt"), label: "Opção 2", value: "op2", imageUrl: "" },
        ],
      };
    case "list-single":
      return {
        ...base,
        variableKey: "resposta",
        autoAdvance: true,
        options: [
          { id: uid("opt"), label: "Opção 1", value: "op1" },
          { id: uid("opt"), label: "Opção 2", value: "op2" },
        ],
      };
    case "list-multiple":
      return {
        ...base,
        variableKey: "respostas",
        minSelections: 1,
        options: [
          { id: uid("opt"), label: "Opção 1", value: "op1" },
          { id: uid("opt"), label: "Opção 2", value: "op2" },
          { id: uid("opt"), label: "Nenhuma", value: "nenhuma", exclusive: true },
        ],
      };
    case "interstitial":
      return {
        ...base,
        title: "Analisando...",
        autoAdvanceMs: 3000,
        loadingMessages: ["Carregando..."],
      };
    case "input-text":
      return {
        ...base,
        fields: [{ variableKey: "nome", label: "Seu nome", inputType: "text", required: true }],
      };
    case "input-number":
      return {
        ...base,
        fields: [{ variableKey: "peso", label: "Seu peso", unit: "kg", min: 30, max: 300, required: true }],
      };
    case "result":
      return {
        ...base,
        headline: "Seu resultado: {{resposta}}",
        body: "Parabéns!",
      };
    case "checkout-redirect":
      return {
        ...base,
        title: "Redirecionando, {{nome}}...",
        baseUrl: "https://checkout.exemplo.com",
        appendParams: { name: "{{nome}}", email: "{{email}}" },
        autoRedirectMs: 3000,
        buttonLabel: "Ir agora",
      };
    default:
      return base;
  }
};

/* ================================================================= */
/*                       SUB-EDITORS (BY TYPE)                       */
/* ================================================================= */

function OptionsEditor({ options = [], onChange, withImages = false }) {
  const update = (i, patch) => {
    const next = [...options];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i) => onChange(options.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([...options, { id: uid("opt"), label: "Nova opção", value: `op${options.length + 1}` }]);
  const moveUp = (i) => {
    if (i === 0) return;
    const next = [...options];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };
  const moveDown = (i) => {
    if (i === options.length - 1) return;
    const next = [...options];
    [next[i + 1], next[i]] = [next[i], next[i + 1]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {options.map((opt, i) => (
        <div key={opt.id || i} className="rounded-lg border p-3 bg-muted/30 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">#{i + 1}</Badge>
            <div className="ml-auto flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => moveUp(i)}>
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => moveDown(i)}>
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(i)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Label (exibido)</Label>
              <Input value={opt.label || ""} onChange={(e) => update(i, { label: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Value (salvo)</Label>
              <Input value={opt.value || ""} onChange={(e) => update(i, { value: e.target.value })} />
            </div>
          </div>
          {withImages && (
            <div>
              <Label className="text-xs">URL da imagem</Label>
              <Input
                placeholder="https://..."
                value={opt.imageUrl || ""}
                onChange={(e) => update(i, { imageUrl: e.target.value })}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Ícone (lucide) opcional</Label>
              <Input
                placeholder="ex: Droplet"
                value={opt.iconName || ""}
                onChange={(e) => update(i, { iconName: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch
                checked={!!opt.exclusive}
                onCheckedChange={(v) => update(i, { exclusive: v })}
              />
              <Label className="text-xs">Exclusiva (desmarca outras)</Label>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={add} className="w-full">
        <Plus className="h-4 w-4 mr-1" /> Adicionar opção
      </Button>
    </div>
  );
}

function FieldsEditor({ fields = [], onChange, numeric = false }) {
  const update = (i, patch) => {
    const next = [...fields];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i) => onChange(fields.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([
      ...fields,
      numeric
        ? { variableKey: `campo${fields.length + 1}`, label: "Novo campo", unit: "", min: 0, max: 1000, required: true }
        : { variableKey: `campo${fields.length + 1}`, label: "Novo campo", inputType: "text", required: true },
    ]);

  return (
    <div className="space-y-3">
      {fields.map((f, i) => (
        <div key={i} className="rounded-lg border p-3 bg-muted/30 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">#{i + 1}</Badge>
            <Button size="icon" variant="ghost" className="ml-auto" onClick={() => remove(i)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">variableKey</Label>
              <Input value={f.variableKey || ""} onChange={(e) => update(i, { variableKey: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Label</Label>
              <Input value={f.label || ""} onChange={(e) => update(i, { label: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Placeholder</Label>
            <Input value={f.placeholder || ""} onChange={(e) => update(i, { placeholder: e.target.value })} />
          </div>
          {numeric ? (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Unidade</Label>
                <Input value={f.unit || ""} onChange={(e) => update(i, { unit: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Mín</Label>
                <Input
                  type="number"
                  value={f.min ?? ""}
                  onChange={(e) => update(i, { min: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs">Máx</Label>
                <Input
                  type="number"
                  value={f.max ?? ""}
                  onChange={(e) => update(i, { max: e.target.value === "" ? undefined : Number(e.target.value) })}
                />
              </div>
            </div>
          ) : (
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select
                value={f.inputType || "text"}
                onValueChange={(v) => update(i, { inputType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="tel">Telefone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch checked={!!f.required} onCheckedChange={(v) => update(i, { required: v })} />
            <Label className="text-xs">Obrigatório</Label>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={add} className="w-full">
        <Plus className="h-4 w-4 mr-1" /> Adicionar campo
      </Button>
    </div>
  );
}

function ParamsEditor({ obj = {}, onChange }) {
  const entries = Object.entries(obj);
  const update = (i, key, value) => {
    const next = [...entries];
    next[i] = [key, value];
    onChange(Object.fromEntries(next));
  };
  const remove = (i) => onChange(Object.fromEntries(entries.filter((_, idx) => idx !== i)));
  const add = () => onChange({ ...obj, [`param${entries.length + 1}`]: "" });

  return (
    <div className="space-y-2">
      {entries.map(([k, v], i) => (
        <div key={i} className="flex gap-2">
          <Input value={k} placeholder="chave" onChange={(e) => update(i, e.target.value, v)} />
          <Input value={v} placeholder="valor ou {{variavel}}" onChange={(e) => update(i, k, e.target.value)} />
          <Button size="icon" variant="ghost" onClick={() => remove(i)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={add} className="w-full" size="sm">
        <Plus className="h-3 w-3 mr-1" /> Adicionar parâmetro
      </Button>
    </div>
  );
}

/* ================================================================= */
/*                          STEP EDITOR                              */
/* ================================================================= */

function StepEditor({ step, onChange }) {
  if (!step) {
    return (
      <div className="h-full grid place-items-center text-muted-foreground">
        Selecione um step para editar
      </div>
    );
  }

  const set = (patch) => onChange({ ...step, ...patch });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge>{step.type}</Badge>
        <Badge variant="outline">{step.id}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>ID do step</Label>
          <Input value={step.id} onChange={(e) => set({ id: e.target.value })} />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={step.type} onValueChange={(v) => set({ type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STEP_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Título (aceita {"{{variavel}}"})</Label>
        <Input value={step.title || ""} onChange={(e) => set({ title: e.target.value })} />
      </div>

      <div>
        <Label>Subtítulo</Label>
        <Textarea rows={2} value={step.subtitle || ""} onChange={(e) => set({ subtitle: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>CTA (botão)</Label>
          <Input value={step.ctaLabel || ""} onChange={(e) => set({ ctaLabel: e.target.value })} />
        </div>
        <div>
          <Label>Próximo step ID</Label>
          <Input value={step.nextStepId || ""} onChange={(e) => set({ nextStepId: e.target.value })} />
        </div>
      </div>

      <Separator />

      {/* -------- Type-specific editors -------- */}

      {(step.type === "image-grid" || step.type === "list-single" || step.type === "list-multiple") && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>variableKey (onde salvar)</Label>
              <Input value={step.variableKey || ""} onChange={(e) => set({ variableKey: e.target.value })} />
            </div>
            {step.type === "image-grid" && (
              <div>
                <Label>Colunas</Label>
                <Select
                  value={String(step.columns || 2)}
                  onValueChange={(v) => set({ columns: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {step.type === "list-multiple" && (
              <div>
                <Label>Mín. seleções</Label>
                <Input
                  type="number"
                  value={step.minSelections ?? 0}
                  onChange={(e) => set({ minSelections: Number(e.target.value) })}
                />
              </div>
            )}
          </div>

          {(step.type === "image-grid" || step.type === "list-single") && (
            <div className="flex items-center gap-2">
              <Switch checked={!!step.autoAdvance} onCheckedChange={(v) => set({ autoAdvance: v })} />
              <Label>Avançar automaticamente ao clicar</Label>
            </div>
          )}

          <div>
            <Label className="mb-2 block">Opções</Label>
            <OptionsEditor
              options={step.options || []}
              withImages={step.type === "image-grid"}
              onChange={(options) => set({ options })}
            />
          </div>
        </>
      )}

      {step.type === "interstitial" && (
        <>
          <div>
            <Label>Auto-avançar após (ms)</Label>
            <Input
              type="number"
              value={step.autoAdvanceMs ?? 3000}
              onChange={(e) => set({ autoAdvanceMs: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Mensagens de loading (uma por linha)</Label>
            <Textarea
              rows={4}
              value={(step.loadingMessages || []).join("\n")}
              onChange={(e) => set({ loadingMessages: e.target.value.split("\n").filter(Boolean) })}
            />
          </div>
          <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
            <Label className="text-xs uppercase tracking-wide">Social Proof (opcional)</Label>
            <Input
              placeholder="Texto (ex: +12.000 pessoas)"
              value={step.socialProof?.text || ""}
              onChange={(e) =>
                set({ socialProof: { ...(step.socialProof || {}), text: e.target.value } })
              }
            />
            <Textarea
              rows={2}
              placeholder="URLs de avatares (uma por linha)"
              value={(step.socialProof?.avatars || []).join("\n")}
              onChange={(e) =>
                set({
                  socialProof: {
                    ...(step.socialProof || {}),
                    avatars: e.target.value.split("\n").filter(Boolean),
                  },
                })
              }
            />
          </div>
          <ActionsEditor
            title="Ações onEnter (ex: computeBMI, categorize)"
            actions={step.onEnter || []}
            onChange={(onEnter) => set({ onEnter })}
          />
        </>
      )}

      {step.type === "input-text" && (
        <FieldsEditor
          fields={step.fields || []}
          onChange={(fields) => set({ fields })}
        />
      )}

      {step.type === "input-number" && (
        <FieldsEditor
          numeric
          fields={step.fields || []}
          onChange={(fields) => set({ fields })}
        />
      )}

      {step.type === "result" && (
        <>
          <div>
            <Label>Headline (aceita {"{{variavel}}"})</Label>
            <Input value={step.headline || ""} onChange={(e) => set({ headline: e.target.value })} />
          </div>
          <div>
            <Label>Corpo (mensagem principal)</Label>
            <Textarea rows={3} value={step.body || ""} onChange={(e) => set({ body: e.target.value })} />
          </div>
        </>
      )}

      {step.type === "checkout-redirect" && (
        <>
          <div>
            <Label>URL base do checkout</Label>
            <Input value={step.baseUrl || ""} onChange={(e) => set({ baseUrl: e.target.value })} />
          </div>
          <div>
            <Label>Auto-redirect após (ms)</Label>
            <Input
              type="number"
              value={step.autoRedirectMs ?? 3000}
              onChange={(e) => set({ autoRedirectMs: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Texto do botão</Label>
            <Input value={step.buttonLabel || ""} onChange={(e) => set({ buttonLabel: e.target.value })} />
          </div>
          <div>
            <Label className="mb-2 block">Parâmetros anexados à URL</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Use {"{{nome}}"}, {"{{email}}"}, {"{{tracking.utm_source}}"}, etc.
            </p>
            <ParamsEditor obj={step.appendParams || {}} onChange={(appendParams) => set({ appendParams })} />
          </div>
        </>
      )}
    </div>
  );
}

/* ================================================================= */
/*                       ACTIONS EDITOR (simple)                     */
/* ================================================================= */

function ActionsEditor({ title, actions = [], onChange }) {
  const update = (i, patch) => {
    const next = [...actions];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i) => onChange(actions.filter((_, idx) => idx !== i));
  const add = (type) => onChange([...actions, { type }]);

  return (
    <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
      <Label className="text-xs uppercase tracking-wide">{title}</Label>
      {actions.map((a, i) => (
        <div key={i} className="rounded border p-2 space-y-2 bg-background">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{a.type}</Badge>
            <Button size="icon" variant="ghost" className="ml-auto" onClick={() => remove(i)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
          {a.type === "computeBMI" && (
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="weightKey" value={a.weightKey || ""} onChange={(e) => update(i, { weightKey: e.target.value })} />
              <Input placeholder="heightKey" value={a.heightKey || ""} onChange={(e) => update(i, { heightKey: e.target.value })} />
              <Input placeholder="outputKey" value={a.outputKey || ""} onChange={(e) => update(i, { outputKey: e.target.value })} />
            </div>
          )}
          {a.type === "categorize" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="inputKey" value={a.inputKey || ""} onChange={(e) => update(i, { inputKey: e.target.value })} />
                <Input placeholder="outputKey" value={a.outputKey || ""} onChange={(e) => update(i, { outputKey: e.target.value })} />
                <Input placeholder="outputMessageKey" value={a.outputMessageKey || ""} onChange={(e) => update(i, { outputMessageKey: e.target.value })} />
              </div>
              <Textarea
                rows={4}
                placeholder='Ranges JSON: [{"max":25,"label":"Normal","message":"..."}]'
                value={JSON.stringify(a.ranges || [], null, 2)}
                onChange={(e) => {
                  try {
                    update(i, { ranges: JSON.parse(e.target.value) });
                  } catch {}
                }}
              />
            </>
          )}
          {a.type === "setVariable" && (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="variableKey" value={a.variableKey || ""} onChange={(e) => update(i, { variableKey: e.target.value })} />
              <Input placeholder="value (aceita {{...}})" value={a.value ?? ""} onChange={(e) => update(i, { value: e.target.value })} />
            </div>
          )}
          {a.type === "trackEvent" && (
            <Input placeholder="eventName" value={a.eventName || ""} onChange={(e) => update(i, { eventName: e.target.value })} />
          )}
        </div>
      ))}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => add("computeBMI")}>+ computeBMI</Button>
        <Button size="sm" variant="outline" onClick={() => add("categorize")}>+ categorize</Button>
        <Button size="sm" variant="outline" onClick={() => add("setVariable")}>+ setVariable</Button>
        <Button size="sm" variant="outline" onClick={() => add("trackEvent")}>+ trackEvent</Button>
      </div>
    </div>
  );
}

/* ================================================================= */
/*                          META/TRACKING TAB                        */
/* ================================================================= */

function MetaTab({ config, onChange }) {
  const set = (patch) => onChange({ ...config, ...patch });
  const setMeta = (patch) => set({ meta: { ...config.meta, ...patch } });
  const setTheme = (patch) => set({ theme: { ...config.theme, ...patch } });
  const setTracking = (patch) => set({ tracking: { ...config.tracking, ...patch } });

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="font-semibold">Meta</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome do quiz</Label>
              <Input value={config.meta?.name || ""} onChange={(e) => setMeta({ name: e.target.value })} />
            </div>
            <div>
              <Label>ID</Label>
              <Input value={config.meta?.id || ""} onChange={(e) => setMeta({ id: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea rows={2} value={config.meta?.description || ""} onChange={(e) => setMeta({ description: e.target.value })} />
          </div>
          <div>
            <Label>Step inicial (ID)</Label>
            <Select value={config.startStepId || ""} onValueChange={(v) => set({ startStepId: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(config.steps || []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.id} ({s.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="font-semibold">Tracking (UTMs)</h3>
          <div>
            <Label>Parâmetros capturados da URL (um por linha)</Label>
            <Textarea
              rows={4}
              value={(config.tracking?.captureParams || []).join("\n")}
              onChange={(e) => setTracking({ captureParams: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={!!config.tracking?.persist} onCheckedChange={(v) => setTracking({ persist: v })} />
            <Label>Persistir em sessionStorage</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="font-semibold">Tema</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cor primária</Label>
              <Input value={config.theme?.primaryColor || ""} onChange={(e) => setTheme({ primaryColor: e.target.value })} />
            </div>
            <div>
              <Label>Cor secundária</Label>
              <Input value={config.theme?.secondaryColor || ""} onChange={(e) => setTheme({ secondaryColor: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================= */
/*                              MAIN APP                             */
/* ================================================================= */

function AdminApp() {
  const [config, setConfig] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Load from API
  useEffect(() => {
    fetch("/api/quiz-config")
      .then((r) => r.json())
      .then((data) => {
        const cfg = data?.config || quizConfigDefault;
        setConfig(cfg);
        setSelectedId(cfg.steps?.[0]?.id || null);
      })
      .catch(() => {
        setConfig(quizConfigDefault);
        setSelectedId(quizConfigDefault.steps?.[0]?.id || null);
      });
  }, []);

  const selectedStep = useMemo(
    () => (config?.steps || []).find((s) => s.id === selectedId) || null,
    [config, selectedId]
  );

  const updateStep = (updated) => {
    const idx = config.steps.findIndex((s) => s.id === selectedStep.id);
    if (idx < 0) return;
    const next = [...config.steps];
    next[idx] = updated;
    setConfig({ ...config, steps: next });
    if (updated.id !== selectedStep.id) setSelectedId(updated.id);
  };

  const addStep = (type) => {
    const s = emptyStepFor(type);
    setConfig({ ...config, steps: [...(config.steps || []), s] });
    setSelectedId(s.id);
  };

  const duplicateStep = (id) => {
    const s = config.steps.find((x) => x.id === id);
    if (!s) return;
    const clone = JSON.parse(JSON.stringify(s));
    clone.id = uid(s.type.replace(/[^a-z]/gi, "").slice(0, 6) || "step");
    setConfig({ ...config, steps: [...config.steps, clone] });
    setSelectedId(clone.id);
  };

  const removeStep = (id) => {
    const next = config.steps.filter((s) => s.id !== id);
    setConfig({ ...config, steps: next });
    if (selectedId === id) setSelectedId(next[0]?.id || null);
  };

  const moveStep = (id, dir) => {
    const idx = config.steps.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= config.steps.length) return;
    const next = [...config.steps];
    [next[idx], next[target]] = [next[target], next[idx]];
    setConfig({ ...config, steps: next });
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/quiz-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      if (!r.ok) throw new Error("Falha ao salvar");
      toast.success("Quiz salvo com sucesso!");
      setPreviewKey((k) => k + 1);
    } catch (e) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const restoreDefault = () => {
    if (!confirm("Substituir configuração atual pelo padrão de exemplo?")) return;
    setConfig(JSON.parse(JSON.stringify(quizConfigDefault)));
    setSelectedId(quizConfigDefault.steps?.[0]?.id || null);
    toast.info("Configuração padrão restaurada (não esqueça de salvar)");
  };

  if (!config) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 grid place-items-center">
            <Settings className="h-4 w-4 text-white" />
          </div>
          <h1 className="font-bold">Editor de Quiz</h1>
          <Badge variant="outline" className="ml-2">{config.steps?.length || 0} steps</Badge>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/" target="_blank">
                <ExternalLink className="h-4 w-4 mr-1" /> Abrir quiz
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={restoreDefault}>
              <RotateCcw className="h-4 w-4 mr-1" /> Restaurar padrão
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Salvar
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="steps" className="w-full">
          <TabsList>
            <TabsTrigger value="steps"><ListTree className="h-4 w-4 mr-1" /> Steps</TabsTrigger>
            <TabsTrigger value="meta"><Settings className="h-4 w-4 mr-1" /> Meta & Tema</TabsTrigger>
            <TabsTrigger value="preview"><Eye className="h-4 w-4 mr-1" /> Preview</TabsTrigger>
            <TabsTrigger value="json"><Code2 className="h-4 w-4 mr-1" /> JSON</TabsTrigger>
          </TabsList>

          {/* -------------------- STEPS TAB -------------------- */}
          <TabsContent value="steps" className="mt-4">
            <div className="grid grid-cols-12 gap-4">
              {/* left: step list */}
              <aside className="col-span-4 xl:col-span-3">
                <Card>
                  <CardContent className="pt-4 space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Steps</div>
                    <div className="space-y-1 max-h-[65vh] overflow-y-auto pr-1">
                      {config.steps.map((s, i) => (
                        <div
                          key={s.id}
                          className={`group rounded-lg border p-2 cursor-pointer transition ${
                            selectedId === s.id ? "border-primary bg-primary/10" : "hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedId(s.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{i + 1}</Badge>
                            <div className="text-sm font-medium truncate flex-1">{s.title || s.id}</div>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="secondary" className="text-[10px]">{s.type}</Badge>
                            <div className="ml-auto flex opacity-0 group-hover:opacity-100 transition">
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveStep(s.id, "up"); }}>
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveStep(s.id, "down"); }}>
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); duplicateStep(s.id); }}>
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); removeStep(s.id); }}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-3" />
                    <div className="text-xs font-semibold text-muted-foreground uppercase">Adicionar step</div>
                    <div className="grid grid-cols-2 gap-1">
                      {STEP_TYPES.map((t) => (
                        <Button
                          key={t.value}
                          variant="outline"
                          size="sm"
                          className="text-[11px] h-8 justify-start"
                          onClick={() => addStep(t.value)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> {t.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </aside>

              {/* right: step editor */}
              <section className="col-span-8 xl:col-span-9">
                <Card>
                  <CardContent className="pt-6">
                    <StepEditor step={selectedStep} onChange={updateStep} />
                  </CardContent>
                </Card>
              </section>
            </div>
          </TabsContent>

          {/* -------------------- META TAB -------------------- */}
          <TabsContent value="meta" className="mt-4">
            <MetaTab config={config} onChange={setConfig} />
          </TabsContent>

          {/* -------------------- PREVIEW TAB -------------------- */}
          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="mb-3 flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Preview usa a última versão salva. Clique em <b>Salvar</b> antes.
                  </p>
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => setPreviewKey((k) => k + 1)}>
                    Recarregar preview
                  </Button>
                </div>
                <div className="rounded-lg border overflow-hidden bg-background" style={{ height: "80vh" }}>
                  <iframe
                    key={previewKey}
                    src="/?utm_source=preview&utm_medium=admin"
                    className="w-full h-full"
                    title="Quiz preview"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* -------------------- JSON TAB -------------------- */}
          <TabsContent value="json" className="mt-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Edite o JSON bruto — cuidado, precisa ser um JSON válido.
                </p>
                <Textarea
                  rows={30}
                  className="font-mono text-xs"
                  value={JSON.stringify(config, null, 2)}
                  onChange={(e) => {
                    try {
                      setConfig(JSON.parse(e.target.value));
                    } catch {
                      // ignore invalid JSON while typing
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

export default AdminApp;
