export interface Entry {
  name: string;
  count: number;
}

export interface DailyPoint {
  date: string;
  count: number;
}

export interface ToolCall {
  name: string;
  input: string;
  output: string;
}

export interface TimelineStep {
  name: string;
  type: string;
  latencyMs: number | null;
}

export interface Condition {
  type: string;
  include: boolean;
  matchType: string | null;
  value: string;
}

export interface Asset {
  kind: "segment" | "trigger";
  name: string;
  description: string;
  operator: string;
  conditions: Condition[];
  raw: unknown;
}

export interface BaseTrace {
  id: string;
  timestamp: string | null;
  prompt: string;
  outcome: string;
  tokens: number;
  cost: number;
  latencyMs: number | null;
  tools: ToolCall[];
  timeline: TimelineStep[];
  metadata: Record<string, string | null>;
}

export interface TargetingTrace extends BaseTrace {
  segments: Asset[];
  triggers: Asset[];
  clarifications: string[];
  response: string | null;
  structured: unknown;
  conditionTypes: string[];
  matchTypes: string[];
}

export interface KaiTrace extends BaseTrace {
  response: string;
  useCase: string;
}

export interface GoalsTrace extends BaseTrace {
  response: string;
  goalSnippet: string | null;
}

export interface Summary {
  totalObservations: number;
  traceCount: number;
  dateRange: { from: string | null; to: string | null };
  modelCost: number;
  modelTokens: number;
  toolLookups?: number;
  generatedAssets?: number;
  clarificationRate?: number;
  docQueries?: number;
  codeGenerated?: number;
}

export interface Dataset<T extends BaseTrace> {
  feature: string;
  generatedAt: string;
  source: string;
  summary: Summary;
  patterns: Record<string, unknown>;
  traces: T[];
  window?: { sinceDays: number; since: string };
}

export type TargetingData = Dataset<TargetingTrace> & {
  patterns: {
    outcomeCounts: Record<string, number>;
    currentObjectCounts: Entry[];
    useCaseClusters: { key: string; label: string; count: number; clarificationRate: number; examples: string[] }[];
    promptShapes: Entry[];
    conditionTypeCounts: Entry[];
    matchTypeCounts: Entry[];
    domains: Entry[];
    users: Entry[];
    sites: Entry[];
    tools: Entry[];
    dailyActivity: DailyPoint[];
  };
};

export type KaiData = Dataset<KaiTrace> & {
  patterns: {
    useCaseCounts: Entry[];
    models: Entry[];
    tools: Entry[];
    topDocQueries: Entry[];
    languages: Entry[];
    promptShapes: Entry[];
    dailyActivity: DailyPoint[];
  };
};

export type GoalsData = Dataset<GoalsTrace> & {
  patterns: {
    agents: Entry[];
    domains: Entry[];
    customers: Entry[];
    tools: Entry[];
    dailyActivity: DailyPoint[];
  };
};
