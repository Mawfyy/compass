import { chatRequestSchema } from "@/domain/chat/schemas";
import { createChatClient } from "@/providers/provider-factory";
import { serializeGuide } from "@/ui/guide/serialize";

function buildSystemPrompt(goal: string, guideJson: string): string {
  return `You are Compass, an expert study coach. The user is following the study guide below. Answer follow-up questions about it: explain concepts, clarify steps, adjust difficulty or pacing, suggest practice or resources, etc.

Formatting rules — always follow these:
- Lead with a 1–2 sentence direct answer.
- Use **bold** lead-ins to separate distinct points (e.g. **Topic:** explanation). For 3+ distinct sections, use ### instead.
- Use bullet or numbered lists for steps, options, and key points.
- Use inline \`code\` for commands, terms, file names, and formulas.
- Use fenced code blocks (\`\`\`) for multi-line code or multi-step instructions.
- Keep paragraphs to 2–4 sentences max — never produce a single wall of text.
- Be concise and scannable. Aim for answers that fit on one screen.

Stay grounded in the guide; if asked something unrelated, briefly answer or redirect back to the guide.

STUDY GUIDE (goal: ${goal}):

${guideJson}`;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Request body must be valid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );
  }

  const { goal, guide, messages } = parsed.data;

  const chatClient = createChatClient();
  if (!chatClient) {
    return new Response(
      JSON.stringify({ error: "Chat provider not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const guideJson = serializeGuide(guide);
    const system = buildSystemPrompt(goal, guideJson);
    const upstream = await chatClient.stream(system, messages);

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat request failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
