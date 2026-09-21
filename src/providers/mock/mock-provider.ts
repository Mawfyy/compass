import type {
  DecisionAnswer,
  DecisionAnswerMap,
  DecisionProvider,
  DecisionQuestion,
  DecisionState,
  ProviderHealth,
} from "../decision-provider";

export interface MockCall {
  state: DecisionState;
  questions: DecisionQuestion[];
}

function defaultAnswer(question: DecisionQuestion): DecisionAnswer {
  switch (question.type) {
    case "noul":
      return { type: "noul", noul: 0.5 };
    case "choice": {
      const options = Object.keys(question.criteria);
      const first = options[0] ?? "";
      const probabilities: Record<string, number> = { [first]: 1 };
      return { type: "choice", choice: first, probabilities, confidence: 1 };
    }
    case "score": {
      const legend: Record<string, string> = {};
      const probabilities: Record<string, number> = { "0": 1 };
      question.criteria.forEach((description, i) => {
        legend[String(i)] = description;
      });
      return { type: "score", score: 0, legend, probabilities, confidence: 1 };
    }
  }
}

/**
 * Deterministic in-memory provider for tests and local development.
 * Answers default per question type and can be overridden per question id.
 * Records every call for assertion in tests.
 */
export class MockProvider implements DecisionProvider {
  readonly id = "mock";
  readonly model = "mock-v1";
  readonly version = "1.0.0";
  readonly calls: MockCall[] = [];

  constructor(private readonly overrides: Record<string, DecisionAnswer> = {}) {}

  async evaluate(
    state: DecisionState,
    questions: DecisionQuestion[],
  ): Promise<DecisionAnswerMap> {
    this.calls.push({ state, questions });
    const answers: DecisionAnswerMap = {};
    for (const question of questions) {
      answers[question.id] = this.overrides[question.id] ?? defaultAnswer(question);
    }
    return answers;
  }

  async health(): Promise<ProviderHealth> {
    return { available: true, latencyMs: 0 };
  }
}
