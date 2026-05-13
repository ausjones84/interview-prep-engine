import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let text = "";
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith(".pdf")) {
      try {
        const pdfParse = (await import("pdf-parse")).default;
        const data = await pdfParse(buffer);
        text = data.text;
      } catch (e) {
        text = "Could not parse PDF. Please paste your resume text manually.";
      }
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch (e) {
        text = "Could not parse DOCX. Please paste your resume text manually.";
      }
    } else {
      text = buffer.toString("utf-8");
    }

    text = text.split("  ").join(" ").split("   ").join(" ").trim();

    return NextResponse.json({ text, length: text.length });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
