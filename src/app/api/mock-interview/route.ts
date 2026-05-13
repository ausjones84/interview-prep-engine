import { NextRequest, NextResponse } from "next/server";
import { gradeMockResponse, generateMockQuestions } from "@/lib/claude";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roleId, studyGuideContent, question, response: userResponse, sessionId, roleContext } = body;

    const supabase = createServerClient();

    if (action === "generate-questions") {
      // Generate mock interview questions
      const questionsJson = await generateMockQuestions(studyGuideContent, 10);
      
      let questions;
      try {
        const cleaned = questionsJson.replace(/```json\n?|\n?```/g, "").trim();
        questions = JSON.parse(cleaned);
      } catch {
        questions = [];
      }

      // Create a new mock session
      const { data: session, error } = await supabase
        .from("mock_sessions")
        .insert({
          role_id: roleId,
          user_id: "default",
          questions,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session, questions });
    }

    if (action === "grade-response") {
      // Grade a mock interview response
      const gradeJson = await gradeMockResponse(question, userResponse, roleContext);
      
      let grade;
      try {
        const cleaned = gradeJson.replace(/```json\n?|\n?```/g, "").trim();
        grade = JSON.parse(cleaned);
      } catch {
        grade = {
          score: 5,
          feedback: gradeJson,
          strengths: [],
          improvements: [],
          ideal_elements: [],
        };
      }

      return NextResponse.json({ grade });
    }

    if (action === "complete-session") {
      // Save completed session
      const { grades, overallScore, feedback } = body;
      
      const { data, error } = await supabase
        .from("mock_sessions")
        .update({
          grades,
          overall_score: overallScore,
          feedback,
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: data });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Mock interview error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
