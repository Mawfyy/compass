import { NextResponse } from "next/server";
import { GenerateMapService } from "@/application/map/generate-map-service";
import { generateMapRequestSchema } from "@/domain/map/schemas";
import { createDecisionProvider, createMapGenerator } from "@/providers/provider-factory";

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

  const parsed = generateMapRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const service = new GenerateMapService(
      createDecisionProvider(),
      createMapGenerator(),
    );
    const map = await service.generate(parsed.data);
    return NextResponse.json({ map });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
