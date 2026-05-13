import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleId, mockGrades, studyGuideExists, resumeExists, audioGenerated } = body;

    // Build readiness score from multiple signals
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are an expert interview readiness evaluator. Calculate a Job Readiness Score (0-100) based on these signals:

Study Guide Generated: ${studyGuideExists ? "YES" : "NO"} (+20 points base)
Resume Uploaded: ${resumeExists ? "YES" : "NO"} (+10 points base)
Audio Study Created: ${audioGenerated ? "YES" : "NO"} (+10 points)
Mock Interview Scores: ${mockGrades?.length > 0 ? JSON.stringify(mockGrades) : "None yet"}

Calculate score breakdown across these dimensions:
1. Knowledge Coverage (0-25): Based on study guide depth
2. Self-Awareness (0-25): Based on STAR scenarios and resume alignment
3. Practice Readiness (0-25): Based on mock interview performance
4. Confidence Level (0-25): Based on audio engagement and practice frequency

Return JSON:
{
  "overall_score": <0-100>,
  "knowledge_coverage": <0-25>,
  "self_awareness": <0-25>,  
  "practice_readiness": <0-25>,
  "confidence_level": <0-25>,
  "status": "Not Started|Building|Getting Ready|Interview Ready|Superstar",
  "next_actions": ["action1", "action2", "action3"],
  "strengths": ["strength1", "strength2"],
  "gaps": ["gap1", "gap2"]
}`
      }]
    });

    const text = (message.content[0] as {type: string; text: string}).text;
    let scoreData;
    try {
      scoreData = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
    } catch {
      scoreData = { overall_score: 0, status: "Building" };
    }

    // Save score to database
    const supabase = createServerClient();
    await supabase.from("readiness_scores").upsert({
      role_id: roleId,
      user_id: "default",
      ...scoreData,
      calculated_at: new Date().toISOString()
    }, { onConflict: "role_id" });

    return NextResponse.json({ score: scoreData });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
