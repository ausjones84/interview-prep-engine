import { NextRequest, NextResponse } from "next/server";

// Next.js 14 App Router: Configure runtime via route segment config
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
        console.error("PDF parse error:", e);
        text = "Could not extract PDF text. Please copy and paste your resume content manually.";
      }
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch (e) {
        console.error("DOCX parse error:", e);
        text = "Could not extract DOCX text. Please copy and paste your resume content manually.";
      }
    } else {
      // Try to read as plain text
      text = buffer.toString("utf-8");
    }

    // Clean up the text
    text = text
      .replace(/s+/g, " ")
      .replace(/
{3,}/g, "

")
      .trim();

    return NextResponse.json({ text, length: text.length });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Resume parse error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
