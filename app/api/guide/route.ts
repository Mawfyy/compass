import { NextResponse } from "next/server";
import { guideRequestSchema } from "@/domain/guide/schemas";
import { createGuideGenerator } from "@/providers/provider-factory";
import type { StudyGuide } from "@/domain/guide/schemas";

function mockGuide(goal: string): StudyGuide {
  return {
    intro: `This is a mock guide shown because no generative guide provider is configured. Set \`PROVIDER=openrouter\` and add an \`OPENROUTER_API_KEY\` to generate a real, personalized guide for: ${goal}.`,
    prerequisites: "A basic familiarity with the subject helps, but you can start from zero.",
    phases: [
      {
        id: "phase-1",
        title: "Phase 1: Foundations",
        duration: "~2 weeks",
        body: `- Identify the core concepts you need to understand first\n- Learn the fundamentals before moving to practice`,
        resources: [
          { kind: "Reading", name: "An introductory book or reference on the subject" },
          { kind: "Course", name: "A beginner-friendly structured course" },
        ],
      },
      {
        id: "phase-2",
        title: "Phase 2: Hands-on practice",
        duration: "~3 weeks",
        body: `- Complete guided drills to build muscle memory\n- Apply the ideas to a small project of your own`,
        resources: [
          { kind: "Exercise", name: "Guided drills and practice problems" },
          { kind: "Exercise", name: "A small personal project" },
        ],
      },
      {
        id: "phase-3",
        title: "Phase 3: Depth and specialization",
        duration: "~4 weeks",
        body: `- Analyze a real-world example in depth\n- Consider a credential to validate your skill`,
        resources: [
          { kind: "Case Study", name: "A real-world example in depth" },
          { kind: "Certification", name: "A credential to validate your skill" },
        ],
      },
    ],
    milestones:
      "- Explain the fundamentals to someone else\n- Build a working project end-to-end\n- Complete a certification or portfolio piece",
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const parsed = guideRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const generator = createGuideGenerator();
    if (generator) {
      const guide = await generator.generate(parsed.data.goal);
      return NextResponse.json({ guide });
    }
    return NextResponse.json({ guide: mockGuide(parsed.data.goal) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Guide generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}