export type DecisionState = string | Record<string, unknown> | unknown[];

export type DecisionQuestion =
  | {
      id: string;
      type: "noul";
      instructions: string;
      criteria?: { yes?: string; no?: string };
    }
  | {
      id: string;
      type: "choice";
      instructions: string;
      criteria: Record<string, string | null>;
    }
  | {
      id: string;
      type: "score";
      instructions: string;
      criteria: [string, ...string[]];
    };

export type DecisionAnswer =
  | { type: "noul"; noul: number }
  | {
      type: "choice";
      choice: string;
      probabilities: Record<string, number>;
      confidence: number;
    }
  | {
      type: "score";
      score: number;
      legend: Record<string, string>;
      probabilities: Record<string, number>;
      confidence: number;
    };

export type DecisionAnswerMap = Record<string, DecisionAnswer>;

export interface ProviderHealth {
  available: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * The seam between the core system and any AI decision provider.
 * Implementations translate these typed primitives to a concrete backend:
 * JevProvider -> @typesafe-ai/sdk, MockProvider -> canned answers, etc.
 */
export interface DecisionProvider {
  readonly id: string;
  readonly model: string;
  readonly version: string;

  evaluate(state: DecisionState, questions: DecisionQuestion[]): Promise<DecisionAnswerMap>;

  health(): Promise<ProviderHealth>;
}
