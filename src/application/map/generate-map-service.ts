import type { DecisionProvider } from "../../providers/decision-provider";
import type { MapGenerator } from "../../providers/map-generator";
import type { GenerateMapRequest } from "../../domain/map/schemas";
import type { LearningGoal, LearningMap } from "../../domain/map/learning-map";
import { createLearningMap } from "../../domain/map/learning-map";
import { MAP_TEMPLATES } from "./map-templates";
import { selectTemplate } from "./select-template-decisions";
import { buildGenericRoot } from "./scaffold";

export class GenerateMapService {
  constructor(
    private readonly provider?: DecisionProvider,
    private readonly generator?: MapGenerator,
  ) {}

  async generate(request: GenerateMapRequest): Promise<LearningMap> {
    const goal: LearningGoal = {
      prompt: request.goal.trim(),
      level: request.level,
      goalKind: request.goalKind,
      depth: request.depth,
      hoursPerWeek: request.hoursPerWeek,
    };

    if (this.generator) {
      try {
        return await this.generator.generate(request);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Map generation failed, falling back to scaffold: ${message}`);
        return createLearningMap({
          goal,
          root: buildGenericRoot(request.goal, request),
        });
      }
    }

    const template = await selectTemplate(
      this.provider,
      request.goal,
      MAP_TEMPLATES,
    );
    const root = template ? template.root : buildGenericRoot(request.goal, request);
    return createLearningMap({ goal, root });
  }
}
