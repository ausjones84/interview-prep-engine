import { NextRequest, NextResponse } from "next/server";
import { generateStudyGuide } from "@/lib/claude";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleId, resumeText, jobDescription, jobTitle, company } = body;

    if (!resumeText && !jobDescription && !jobTitle) {
      return NextResponse.json(
        { error: "Need at least a resume or job description" },
        { status: 400 }
      );
    }

    // Generate study guide via Claude
    const guideContent = await generateStudyGuide({
      resumeText: resumeText || "",
      jobDescription: jobDescription || "",
      jobTitle,
      company,
    });

    // Parse sections from the generated content
    const sections = parseStudyGuide(guideContent);

    const supabase = createServerClient();

    // Save to database
    const { data: guide, error } = await supabase
      .from("study_guides")
      .insert({
        role_id: roleId,
        user_id: "default",
        role_overview: sections.roleOverview,
        acronyms_cheat_sheet: sections.acronyms,
        top_questions: sections.topQuestions,
        star_scenarios: sections.starScenarios,
        study_30min: sections.study30min,
        study_60min: sections.study60min,
        full_content: guideContent,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ guide, content: guideContent });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error generating guide:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function parseStudyGuide(content: string) {
  const sections: Record<string, string> = {};
  
  // Split by headers
  const headerRegex = /^#\s+(.+)$/m;
  const parts = content.split(/(?=^#\s)/m);
  
  for (const part of parts) {
    if (part.includes("ROLE OVERVIEW")) sections.roleOverview = part;
    else if (part.includes("ACRONYMS")) sections.acronyms = part;
    else if (part.includes("TOP 20") || part.includes("INTERVIEW QUESTIONS")) sections.topQuestionsText = part;
    else if (part.includes("STAR")) sections.starScenariosText = part;
    else if (part.includes("30-MINUTE") || part.includes("30 MINUTE")) sections.study30min = part;
    else if (part.includes("60-MINUTE") || part.includes("60 MINUTE")) sections.study60min = part;
  }

  // Return parsed sections (questions/scenarios would need more parsing for JSONB)
  return {
    roleOverview: sections.roleOverview || "",
    acronyms: sections.acronyms || "",
    topQuestions: null, // Store as text for simplicity
    starScenarios: null,
    study30min: sections.study30min || "",
    study60min: sections.study60min || "",
  };
}
