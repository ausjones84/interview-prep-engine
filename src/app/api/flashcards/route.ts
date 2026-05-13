import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guideContent } = body;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `You are creating flashcards from an interview study guide. Generate 30 high-quality flashcards.

Study Guide:
${guideContent?.substring(0, 4000)}

Create flashcards covering:
- Technical acronyms/concepts (front: term, back: definition + example)
- Behavioral questions (front: question, back: STAR framework + key points)
- Technical knowledge (front: concept, back: explanation)
- Role-specific scenarios (front: situation, back: best approach)

Return JSON array (exactly 30 cards):
[
  {
    "id": "card_1",
    "front": "What does ECS stand for and when would you use it?",
    "back": "Elastic Container Service — AWS managed container orchestration. Use when: running Docker containers at scale without managing Kubernetes. Key advantage: tight AWS integration (IAM, VPC, ALB). Better than K8s when your team is small and AWS-native.",
    "category": "AWS",
    "difficulty": 2
  }
]

Difficulty: 1=easy, 2=medium, 3=hard, 4=very hard, 5=expert
Make back answers interview-ready — not just definitions but HOW to use them in an interview.`
      }]
    });

    const text = (message.content[0] as {type: string; text: string}).text;
    let cards;
    try {
      const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
      const rawCards = JSON.parse(cleaned);
      cards = rawCards.map((c: Record<string, unknown>, i: number) => ({
        ...c,
        id: c.id || `card_${i}`,
        mastered: false,
        seenCount: 0,
        difficulty: c.difficulty || 2,
      }));
    } catch {
      cards = [];
    }

    return NextResponse.json({ cards, count: cards.length });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
