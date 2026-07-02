/**
 * ============================================================================
 * Dynamic Quiz Generator — Type Definitions
 * ----------------------------------------------------------------------------
 * Toda a aplicação é dirigida por um arquivo `quizConfig.json`.
 * O idioma padrão dos textos/labels é PT-BR.
 * ============================================================================
 */

/* -------------------------------------------------------------------------- */
/*                              GLOBAL / META                                 */
/* -------------------------------------------------------------------------- */

export type Locale = "pt-BR" | "en-US" | "es-ES";

export interface QuizTheme {
  primaryColor: string;      // ex: "#7C3AED"
  secondaryColor: string;    // ex: "#F59E0B"
  backgroundColor: string;   // ex: "#0B1020"
  textColor: string;         // ex: "#F8FAFC"
  fontFamily?: string;       // ex: "Inter, sans-serif"
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  logoUrl?: string;
}

export interface QuizMeta {
  id: string;
  name: string;
  locale: Locale;
  version: string;
  description?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
}

/* -------------------------------------------------------------------------- */
/*                                TRACKING                                    */
/* -------------------------------------------------------------------------- */

/**
 * Parâmetros de URL capturados automaticamente na inicialização.
 * A lista padrão inclui as principais UTMs + `src`.
 */
export type TrackingParamKey =
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "utm_content"
  | "utm_term"
  | "src"
  | string; // permite chaves customizadas

export interface TrackingConfig {
  /** Chaves que devem ser lidas da URL e persistidas no store. */
  captureParams: TrackingParamKey[];
  /** Persistir em localStorage/sessionStorage para sobreviver a reloads. */
  persist: boolean;
  storageKey?: string; // default: "quiz_tracking"
  /** Pixels/eventos opcionais disparados em transições de step. */
  pixels?: {
    facebook?: { pixelId: string; events?: string[] };
    gtm?: { containerId: string };
    tiktok?: { pixelId: string };
  };
}

/* -------------------------------------------------------------------------- */
/*                          VARIABLES / INTERPOLATION                         */
/* -------------------------------------------------------------------------- */

/**
 * Variáveis criadas por steps de input/opções ficam disponíveis no store
 * e podem ser interpoladas em qualquer texto via {{nomeDaVariavel}}.
 */
export type VariableType =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object";

export interface VariableDefinition {
  key: string;              // ex: "nome", "peso", "altura", "imc", "imcCategoria"
  type: VariableType;
  defaultValue?: unknown;
  required?: boolean;
  description?: string;
}

/* -------------------------------------------------------------------------- */
/*                               STEP OPTIONS                                 */
/* -------------------------------------------------------------------------- */

export interface StepOption {
  id: string;
  label: string;           // texto exibido (pt-BR)
  value: string | number;  // valor persistido no store
  imageUrl?: string;       // usado em image-grid
  iconName?: string;       // usado em list-single/list-multiple (lucide-react)
  description?: string;
  /**
   * Se true, ao selecionar esta opção todas as outras são desmarcadas.
   * Usado em list-multiple (ex: "Nenhuma das anteriores").
   */
  exclusive?: boolean;
  /** Salto condicional imediato ao selecionar esta opção. */
  nextStepId?: string;
}

/* -------------------------------------------------------------------------- */
/*                              STEP TYPES (UI)                               */
/* -------------------------------------------------------------------------- */

export type StepType =
  | "image-grid"
  | "list-single"
  | "list-multiple"
  | "interstitial"
  | "input-text"
  | "input-number"
  | "result"
  | "checkout-redirect";

export interface BaseStep {
  id: string;
  type: StepType;
  title?: string;           // suporta {{interpolacao}}
  subtitle?: string;        // suporta {{interpolacao}}
  headline?: string;        // suporta {{interpolacao}}
  imageUrl?: string;
  progress?: number;        // 0-100, opcional (override do progresso automático)
  showProgressBar?: boolean;
  showBackButton?: boolean;
  ctaLabel?: string;        // ex: "Continuar"
  /** Próximo step padrão (fallback caso não haja lógica condicional). */
  nextStepId?: string;
  /** Regras de transição condicionais avaliadas ao avançar. */
  transitions?: TransitionRule[];
  /** Efeitos colaterais ao ENTRAR no step (ex: rodar cálculo IMC). */
  onEnter?: LogicAction[];
  /** Efeitos colaterais ao SAIR do step. */
  onExit?: LogicAction[];
}

/* ---------------------------- Visuais ------------------------------------- */

export interface ImageGridStep extends BaseStep {
  type: "image-grid";
  variableKey: string;          // onde salvar a escolha
  columns?: 2 | 3 | 4;
  options: StepOption[];
  autoAdvance?: boolean;        // avançar automaticamente ao clicar
}

export interface ListSingleStep extends BaseStep {
  type: "list-single";
  variableKey: string;
  options: StepOption[];
  autoAdvance?: boolean;
}

export interface ListMultipleStep extends BaseStep {
  type: "list-multiple";
  variableKey: string;          // salva como array
  options: StepOption[];
  minSelections?: number;
  maxSelections?: number;
  /**
   * Se algum StepOption tiver `exclusive: true`, ao marcá-lo os demais
   * são desmarcados; ao marcar qualquer outro, o exclusivo é desmarcado.
   */
}

export interface InterstitialStep extends BaseStep {
  type: "interstitial";
  /** Tempo em ms antes de avançar automaticamente. */
  autoAdvanceMs?: number;
  /** Lista de mensagens que rodam em sequência (efeito "analisando..."). */
  loadingMessages?: string[];
  /** Prova social opcional. */
  socialProof?: {
    avatars?: string[];
    text?: string; // ex: "+12.398 mulheres já fizeram este teste"
  };
  variant?: "loading" | "warning" | "social-proof" | "success";
}

/* --------------------------- Inputs de Lead ------------------------------- */

export interface InputTextStep extends BaseStep {
  type: "input-text";
  fields: Array<{
    variableKey: string;      // ex: "nome" | "email"
    label: string;
    placeholder?: string;
    inputType?: "text" | "email" | "tel";
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;         // regex
    errorMessage?: string;
  }>;
}

export interface InputNumberStep extends BaseStep {
  type: "input-number";
  fields: Array<{
    variableKey: string;      // ex: "peso" | "altura"
    label: string;
    placeholder?: string;
    unit?: string;            // ex: "kg", "cm"
    min?: number;
    max?: number;
    step?: number;
    required?: boolean;
    errorMessage?: string;
  }>;
}

/* ------------------------- Resultado / Redirect --------------------------- */

export interface ResultStep extends BaseStep {
  type: "result";
  /** Bloco de conteúdo dinâmico, interpolado com variáveis. */
  body: string;
  highlights?: Array<{ label: string; value: string; icon?: string }>;
}

export interface CheckoutRedirectStep extends BaseStep {
  type: "checkout-redirect";
  /** URL base de destino (ex: página de checkout ou VSL). */
  baseUrl: string;
  /**
   * Query params a serem anexados. Se o valor começar com `{{...}}`,
   * será interpolado com a variável do store; caso contrário, valor literal.
   */
  appendParams: Record<string, string>;
  /** Redireciona automaticamente após X ms (0 = imediato). */
  autoRedirectMs?: number;
  /** Abrir em nova aba? */
  openInNewTab?: boolean;
  /** Texto do botão manual, caso autoRedirectMs seja indefinido. */
  buttonLabel?: string;
}

export type Step =
  | ImageGridStep
  | ListSingleStep
  | ListMultipleStep
  | InterstitialStep
  | InputTextStep
  | InputNumberStep
  | ResultStep
  | CheckoutRedirectStep;

/* -------------------------------------------------------------------------- */
/*                           LOGIC / RULES ENGINE                             */
/* -------------------------------------------------------------------------- */

export type ComparisonOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "notIn"
  | "between"
  | "contains"
  | "isEmpty"
  | "isNotEmpty";

export interface Condition {
  variableKey: string;                 // ex: "imc"
  operator: ComparisonOperator;
  value?: unknown;                     // valor único ou array (para in/between)
  /** Combinação com outras condições dentro de uma TransitionRule. */
  combinator?: "AND" | "OR";
}

export interface TransitionRule {
  /** Lista de condições avaliadas com AND por padrão. */
  when: Condition[];
  /** Step de destino se as condições forem satisfeitas. */
  goToStepId: string;
  /** Ações opcionais a executar antes da transição. */
  actions?: LogicAction[];
}

/* --------------------------- Logic Actions -------------------------------- */

export type LogicActionType =
  | "setVariable"
  | "computeBMI"
  | "computeFormula"
  | "categorize"
  | "trackEvent";

export interface SetVariableAction {
  type: "setVariable";
  variableKey: string;
  value: unknown; // pode ser literal ou string com {{interpolacao}}
}

export interface ComputeBMIAction {
  type: "computeBMI";
  /** Variáveis de entrada. */
  weightKey: string;   // ex: "peso" em kg
  heightKey: string;   // ex: "altura" em cm
  /** Onde salvar o valor numérico do IMC. */
  outputKey: string;   // ex: "imc"
  /** Casas decimais (default: 1). */
  decimals?: number;
}

/**
 * Fórmula genérica avaliada em runtime.
 * Ex: expression = "{{peso}} / (({{altura}}/100) * ({{altura}}/100))"
 */
export interface ComputeFormulaAction {
  type: "computeFormula";
  expression: string;
  outputKey: string;
  decimals?: number;
}

/**
 * Categoriza um valor numérico em faixas e salva o rótulo + mensagem.
 */
export interface CategorizeAction {
  type: "categorize";
  inputKey: string;                // ex: "imc"
  outputKey: string;               // ex: "imcCategoria"
  outputMessageKey?: string;       // ex: "imcMensagem"
  ranges: Array<{
    min?: number;                  // inclusive
    max?: number;                  // exclusive
    label: string;                 // ex: "Normal"
    message?: string;              // pode conter {{interpolacao}}
    nextStepId?: string;           // salto opcional
  }>;
}

export interface TrackEventAction {
  type: "trackEvent";
  eventName: string;
  payload?: Record<string, unknown>;
  targets?: Array<"facebook" | "gtm" | "tiktok">;
}

export type LogicAction =
  | SetVariableAction
  | ComputeBMIAction
  | ComputeFormulaAction
  | CategorizeAction
  | TrackEventAction;

/* -------------------------------------------------------------------------- */
/*                             ROOT CONFIG                                    */
/* -------------------------------------------------------------------------- */

export interface QuizConfig {
  meta: QuizMeta;
  theme: QuizTheme;
  tracking: TrackingConfig;
  variables: VariableDefinition[];
  /** ID do primeiro step. */
  startStepId: string;
  steps: Step[];
}

/* -------------------------------------------------------------------------- */
/*                          RUNTIME STORE (ZUSTAND)                           */
/* -------------------------------------------------------------------------- */

/**
 * Formato esperado do estado global (Zustand) — apenas referência de tipagem.
 * Será implementado na Fase 2.
 */
export interface QuizRuntimeState {
  /** ID do step atualmente renderizado. */
  currentStepId: string;
  /** Histórico de steps visitados (para botão "Voltar"). */
  history: string[];
  /** Todas as variáveis coletadas ao longo do funil. */
  variables: Record<string, unknown>;
  /** Parâmetros de tracking capturados na inicialização. */
  tracking: Record<string, string>;
  /** Progresso percentual calculado (0-100). */
  progress: number;
  /** Timestamp de início — útil para analytics. */
  startedAt: number;
  /** Flag global de carregamento (usada por interstitials). */
  isLoading: boolean;
}
