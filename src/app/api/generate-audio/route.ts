import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleId, studyGuideId, text, title } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

    // Call ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text: text.substring(0, 5000), // ElevenLabs limit
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `ElevenLabs error: ${errorText}` },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);

    const supabase = createServerClient();

    // Upload to Supabase Storage
    const fileName = `${roleId}/${Date.now()}-study-guide.mp3`;
    const { error: uploadError } = await supabase.storage
      .from("audio")
      .upload(fileName, audioBytes, {
        contentType: "audio/mpeg",
        cacheControl: "3600",
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("audio")
      .getPublicUrl(fileName);

    // Save to audio_library table
    const { data: audioRecord, error: dbError } = await supabase
      .from("audio_library")
      .insert({
        role_id: roleId,
        study_guide_id: studyGuideId,
        user_id: "default",
        title: title || "Study Guide Audio",
        file_url: urlData.publicUrl,
        file_size: audioBytes.length,
        voice_id: voiceId,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ audio: audioRecord, url: urlData.publicUrl });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error generating audio:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
