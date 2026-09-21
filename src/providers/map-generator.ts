import type { LearningMap } from "../domain/map/learning-map";
import type { GenerateMapRequest } from "../domain/map/schemas";

/**
 * The seam for generative map providers. Unlike `DecisionProvider` (which
 * answers structured judgments), a `MapGenerator` produces an entire
 * `LearningMap` from a goal request. The deterministic/mock path lives inside
 * `GenerateMapService`, so this is only needed for real generative backends
 * such as OpenRouter.
 */
export interface MapGenerator {
  readonly id: string;
  readonly model: string;

  generate(request: GenerateMapRequest): Promise<LearningMap>;
}
