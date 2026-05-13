"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Volume2, Mic, Layers, RefreshCw, Clock, BookOpen } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import type { Role, StudyGuide } from "@/types";

export default function RolePage() {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"full" | "30min" | "60min">("full");

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [roleRes, guideRes] = await Promise.all([
        supabase.from("roles").select("*").eq("id", id).single(),
        supabase.from("study_guides").select("*").eq("role_id", id).order("created_at", { ascending: false }).limit(1).single(),
      ]);

      if (roleRes.data) setRole(roleRes.data);
      if (guideRes.data) setGuide(guideRes.data);

      // Check for existing audio
      const { data: audioData } = await supabase
        .from("audio_library")
        .select("file_url")
        .eq("role_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (audioData) setAudioUrl(audioData.file_url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function generateAudio() {
    if (!guide?.full_content) return;
    setGeneratingAudio(true);
    try {
      const resp = await fetch("/api/generate-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: id,
          studyGuideId: guide.id,
          text: guide.full_content.substring(0, 5000),
          title: `${role?.title} Study Guide`,
        }),
      });
      if (resp.ok) {
        const { url } = await resp.json();
        setAudioUrl(url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingAudio(false);
    }
  }

  const getContent = () => {
    if (!guide) return "";
    if (activeSection === "30min") return guide.study_30min || guide.full_content || "";
    if (activeSection === "60min") return guide.study_60min || guide.full_content || "";
    return guide.full_content || "";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="sticky top-0 z-50 bg-dark-800/90 backdrop-blur border-b border-dark-600">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-white truncate">{role?.title}</h1>
              {role?.company && <p className="text-xs text-gray-400">{role.company}</p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={generateAudio}
              disabled={generatingAudio || !guide}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
            >
              {generatingAudio ? (
                <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" />
              ) : (
                <Volume2 size={12} />
              )}
              {audioUrl ? "Regenerate Audio" : "Generate Audio"}
            </button>
            {audioUrl && (
              <a
                href={audioUrl}
                className="flex items-center gap-1.5 bg-green-800 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
              >
                <Volume2 size={12} />
                Play MP3
              </a>
            )}
            <Link
              href={`/role/${id}/mock`}
              className="flex items-center gap-1.5 bg-dark-700 hover:bg-dark-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
            >
              <Mic size={12} />
              Mock Interview
            </Link>
            <Link
              href={`/role/${id}/combine`}
              className="flex items-center gap-1.5 bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
            >
              <Layers size={12} />
              Combine Roles
            </Link>
          </div>

          {/* Section Toggle */}
          {guide && (
            <div className="flex gap-1 mt-3">
              {[
                { key: "full", icon: BookOpen, label: "Full Guide" },
                { key: "30min", icon: Clock, label: "30 Min" },
                { key: "60min", icon: Clock, label: "60 Min" },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key as typeof activeSection)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activeSection === key
                      ? "bg-brand-600 text-white"
                      : "bg-dark-700 text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {!guide ? (
          <div className="text-center py-20">
            <BookOpen size={40} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No study guide yet</p>
            <button
              onClick={async () => {
                setLoading(true);
                await fetch("/api/generate-guide", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    roleId: id,
                    jobTitle: role?.title,
                    company: role?.company,
                    jobDescription: role?.job_description,
                    resumeText: role?.resume_text,
                  }),
                });
                await loadData();
                setLoading(false);
              }}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold mx-auto"
            >
              <RefreshCw size={16} />
              Generate Study Guide
            </button>
          </div>
        ) : (
          <motion.div
            key={activeSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose prose-invert max-w-none"
          >
            <ReactMarkdown>{getContent()}</ReactMarkdown>
          </motion.div>
        )}
      </main>
    </div>
  );
}
