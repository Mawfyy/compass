import { TypeSafeClient, choice, noul, score } from "@typesafe-ai/sdk";
import type { EntryType, Questions, Question } from "@typesafe-ai/sdk";
import type {
  DecisionAnswer,
  DecisionAnswerMap,
  DecisionProvider,
  DecisionQuestion,
  DecisionState,
  ProviderHealth,
} from "../decision-provider";

export interface JevProviderConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  timeoutMs?: number;
  /** Custom transport, used by tests to stub the TypeSafe API. */
  fetch?: (input: string, init?: RequestInit) => Promise<Response>;
}

function toSdkQuestion(question: DecisionQuestion): Question {
  switch (question.type) {
    case "noul":
      return noul(
        question.instructions,
        question.criteria
          ? { true: question.criteria.yes, false: question.criteria.no }
          : undefined,
      );
    case "choice":
      return choice(question.instructions, question.criteria);
    case "score":
      return score(
        question.instructions,
        question.criteria as [EntryType, EntryType, ...EntryType[]],
      );
  }
}

function fromSdkAnswer(
  answer:
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
      },
): DecisionAnswer {
  switch (answer.type) {
    case "noul":
      return { type: "noul", noul: answer.noul };
    case "choice":
      return {
        type: "choice",
        choice: answer.choice,
        probabilities: answer.probabilities,
        confidence: answer.confidence,
      };
    case "score":
      return {
        type: "score",
        score: answer.score,
        legend: answer.legend,
        probabilities: answer.probabilities,
        confidence: answer.confidence,
      };
  }
}

/**
 * Real TypeSafe / Jev System One provider. Translates the domain decision
 * primitives (noul / score / choice) into TypeSafe questions and maps the
 * typed answers back into `DecisionAnswer`s.
 */
export class JevProvider implements DecisionProvider {
  readonly id = "jev";
  readonly model: string;
  readonly version: string;

  private readonly client: TypeSafeClient;

  constructor(config: JevProviderConfig) {
    this.model = config.model ?? "jev-latest";
    this.version = this.model;
    this.client = new TypeSafeClient({
      apiKey: config.apiKey,
      defaultModel: this.model,
      baseURL: config.baseURL,
      timeout: config.timeoutMs,
      logLevel: "warn",
      fetch: config.fetch,
    });
  }

  async evaluate(
    state: DecisionState,
    questions: DecisionQuestion[],
  ): Promise<DecisionAnswerMap> {
    const sdkQuestions: Questions = {};
    for (const question of questions) {
      sdkQuestions[question.id] = toSdkQuestion(question);
    }

    const result = await this.client.systemOne({
      state: state as EntryType,
      questions: sdkQuestions,
    });

    const answers: DecisionAnswerMap = {};
    for (const question of questions) {
      const raw = result.answers[question.id];
      if (!raw) continue;
      answers[question.id] = fromSdkAnswer(
        raw as Parameters<typeof fromSdkAnswer>[0],
      );
    }
    return answers;
  }

  async health(): Promise<ProviderHealth> {
    const started = Date.now();
    try {
      await this.client.models.list();
      return { available: true, latencyMs: Date.now() - started };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
