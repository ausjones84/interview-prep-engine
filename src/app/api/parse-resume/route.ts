import { NextRequest, NextResponse } from "next/server";

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

    if (file.name.endsWith(".pdf")) {
      // Dynamic import to avoid build issues
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      // Try to read as plain text
      text = buffer.toString("utf-8");
    }

    // Clean up the text
    text = text
      .replace(/\s+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return NextResponse.json({ text, length: text.length });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Resume parse error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
