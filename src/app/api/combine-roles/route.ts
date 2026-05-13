import { NextRequest, NextResponse } from "next/server";
import { generateCombinedGuide } from "@/lib/claude";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleIds } = body;

    if (!roleIds || roleIds.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 roles to combine" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch all roles
    const { data: roles, error: rolesError } = await supabase
      .from("roles")
      .select("*")
      .in("id", roleIds);

    if (rolesError) {
      return NextResponse.json({ error: rolesError.message }, { status: 500 });
    }

    if (!roles || roles.length === 0) {
      return NextResponse.json({ error: "Roles not found" }, { status: 404 });
    }

    // Generate combined guide
    const guideContent = await generateCombinedGuide({
      roles: roles.map((r) => ({
        title: r.title,
        company: r.company,
        jobDescription: r.job_description,
        resumeText: r.resume_text,
      })),
    });

    // Create a meta-role for the combined guide
    const combinedTitle = roles.map((r) => r.title).join(" + ");
    
    const { data: metaRole, error: metaError } = await supabase
      .from("roles")
      .insert({
        title: `[Combined] ${combinedTitle}`,
        company: "Multiple",
        job_description: `Combined prep for: ${combinedTitle}`,
        user_id: "default",
      })
      .select()
      .single();

    if (metaError) {
      return NextResponse.json({ error: metaError.message }, { status: 500 });
    }

    // Save the combined study guide
    const { data: guide, error: guideError } = await supabase
      .from("study_guides")
      .insert({
        role_id: metaRole.id,
        user_id: "default",
        full_content: guideContent,
        role_overview: `Combined study guide for ${combinedTitle}`,
      })
      .select()
      .single();

    if (guideError) {
      return NextResponse.json({ error: guideError.message }, { status: 500 });
    }

    return NextResponse.json({
      guide,
      metaRole,
      content: guideContent,
      roleCount: roles.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Combine roles error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
