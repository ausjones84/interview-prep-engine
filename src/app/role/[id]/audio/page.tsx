"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Pause, Volume2, Download, Loader } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Role, AudioFile } from "@/types";

export default function AudioLibraryPage() {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [roleRes, audioRes] = await Promise.all([
        supabase.from("roles").select("*").eq("id", id).single(),
        supabase.from("audio_library").select("*").eq("role_id", id).order("created_at", { ascending: false }),
      ]);
      if (roleRes.data) setRole(roleRes.data);
      if (audioRes.data) setAudioFiles(audioRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function generateNewAudio() {
    const { data: guideData } = await supabase
      .from("study_guides")
      .select("id, full_content")
      .eq("role_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!guideData?.full_content) {
      alert("Generate a study guide first");
      return;
    }

    setGenerating(true);
    try {
      const resp = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: id,
          studyGuideId: guideData.id,
          text: guideData.full_content.substring(0, 5000),
          title: `${role?.title} — Study Guide Audio`,
        }),
      });
      if (resp.ok) await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  function togglePlay(file: AudioFile) {
    if (playingId === file.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = file.file_url;
        audioRef.current.play();
        setPlayingId(file.id);
        audioRef.current.ontimeupdate = () => {
          if (audioRef.current) {
            setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100);
          }
        };
        audioRef.current.onended = () => {
          setPlayingId(null);
          setProgress(0);
        };
      }
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <audio ref={audioRef} />
      
      <header className="sticky top-0 z-50 bg-dark-800/90 backdrop-blur border-b border-dark-600">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={`/role/${id}`} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Audio Library</h1>
            {role && <p className="text-xs text-gray-400">{role.title}</p>}
          </div>
          <button
            onClick={generateNewAudio}
            disabled={generating}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            {generating ? <Loader size={12} className="animate-spin" /> : <Volume2 size={12} />}
            {generating ? "Generating..." : "New Audio"}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : audioFiles.length === 0 ? (
          <div className="text-center py-20">
            <Volume2 size={40} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No audio files yet</p>
            <p className="text-gray-600 text-sm mb-6">Generate audio to listen at the gym, in the car, anywhere</p>
            <button
              onClick={generateNewAudio}
              disabled={generating}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              {generating ? "Generating..." : "Generate Audio MP3"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {audioFiles.map((file, i) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-dark-800 rounded-2xl p-4 border border-dark-600"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePlay(file)}
                    className="w-12 h-12 bg-brand-600 hover:bg-brand-700 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                  >
                    {playingId === file.id ? (
                      <Pause size={20} className="text-white" />
                    ) : (
                      <Play size={20} className="text-white ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{file.title}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(file.created_at).toLocaleDateString()}
                      {file.file_size && ` · ${(file.file_size / 1024 / 1024).toFixed(1)} MB`}
                    </p>
                    {playingId === file.id && (
                      <div className="mt-2 h-1 bg-dark-600 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <a
                    href={file.file_url}
                    download
                    className="text-gray-400 hover:text-white transition-colors p-2"
                  >
                    <Download size={16} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
