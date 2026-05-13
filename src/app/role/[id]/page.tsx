"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Volume2, Mic, Layers, RefreshCw, Clock, BookOpen, Zap, DollarSign, Globe, Calendar, CreditCard, TrendingUp } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import type { Role, StudyGuide } from "@/types";

interface ReadinessScore {
  overall_score: number;
  knowledge_coverage: number;
  self_awareness: number;
  practice_readiness: number;
  confidence_level: number;
  status: string;
  next_actions: string[];
  strengths: string[];
  gaps: string[];
}

const TOOLS = [
  { key: "guide", icon: BookOpen, label: "Study Guide", desc: "Full guide + 30/60 min formats", href: "", color: "text-blue-400 bg-blue-900/30 border-blue-800/50", primary: true },
  { key: "audio", icon: Volume2, label: "Audio MP3", desc: "Listen at the gym / commute", href: "/audio", color: "text-green-400 bg-green-900/30 border-green-800/50" },
  { key: "mock", icon: Mic, label: "Mock Interview", desc: "Claude grades you live 1-10", href: "/mock", color: "text-purple-400 bg-purple-900/30 border-purple-800/50" },
  { key: "flashcards", icon: Zap, label: "Flashcards", desc: "30 spaced repetition cards", href: "/flashcards", color: "text-yellow-400 bg-yellow-900/30 border-yellow-800/50" },
  { key: "research", icon: Globe, label: "Company Intel", desc: "Culture, stack, smart questions", href: "/research", color: "text-cyan-400 bg-cyan-900/30 border-cyan-800/50" },
  { key: "salary", icon: DollarSign, label: "Salary Coach", desc: "Word-for-word negotiation scripts", href: "/salary", color: "text-emerald-400 bg-emerald-900/30 border-emerald-800/50" },
  { key: "interview-day", icon: Calendar, label: "Interview Day", desc: "Countdown + 15-item checklist", href: "/interview-day", color: "text-orange-400 bg-orange-900/30 border-orange-800/50" },
  { key: "combine", icon: Layers, label: "Combine Roles", desc: "Unified guide for multiple roles", href: "/combine", color: "text-pink-400 bg-pink-900/30 border-pink-800/50" },
];

export default function RolePage() {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [readiness, setReadiness] = useState<ReadinessScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [generatingGuide, setGeneratingGuide] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"guide" | "full" | "30min" | "60min">("guide");
  const [view, setView] = useState<"dashboard" | "reading">("dashboard");

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
      if (!guideRes.error && guideRes.data) setGuide(guideRes.data);

      const { data: audioData } = await supabase
        .from("audio_library")
        .select("file_url")
        .eq("role_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (audioData) setAudioUrl(audioData.file_url);

      // Load readiness score
      const { data: scoreData } = await supabase
        .from("readiness_scores")
        .select("*")
        .eq("role_id", id)
        .single();
      if (scoreData) setReadiness(scoreData);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function generateGuide() {
    if (!role) return;
    setGeneratingGuide(true);
    try {
      await fetch("/api/generate-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: id,
          jobTitle: role.title,
          company: role.company,
          jobDescription: role.job_description,
          resumeText: role.resume_text,
        }),
      });
      await loadData();
    } catch (e) { console.error(e); }
    finally { setGeneratingGuide(false); }
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
    } catch (e) { console.error(e); }
    finally { setGeneratingAudio(false); }
  }

  async function refreshReadiness() {
    const { data: mockData } = await supabase
      .from("mock_sessions")
      .select("grades, overall_score")
      .eq("role_id", id)
      .not("completed_at", "is", null);

    const grades = mockData?.flatMap(s => s.grades || []).map((g: {score?: number}) => g.score || 0) || [];

    const resp = await fetch("/api/readiness-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roleId: id,
        mockGrades: grades,
        studyGuideExists: !!guide,
        resumeExists: !!role?.resume_text,
        audioGenerated: !!audioUrl,
      }),
    });
    if (resp.ok) {
      const { score } = await resp.json();
      setReadiness(score);
    }
  }

  const getContent = () => {
    if (!guide) return "";
    if (activeSection === "30min") return guide.study_30min || guide.full_content || "";
    if (activeSection === "60min") return guide.study_60min || guide.full_content || "";
    return guide.full_content || "";
  };

  const scoreColor = (s: number) =>
    s >= 80 ? "text-green-400" : s >= 60 ? "text-yellow-400" : s >= 40 ? "text-orange-400" : "text-red-400";
  const scoreGradient = (s: number) =>
    s >= 80 ? "from-green-500 to-emerald-400" : s >= 60 ? "from-yellow-500 to-orange-400" : "from-orange-500 to-red-400";

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
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{role?.title}</h1>
            {role?.company && <p className="text-xs text-gray-400">{role.company}</p>}
          </div>
          {view === "reading" && (
            <button onClick={() => setView("dashboard")} className="text-sm text-gray-400 hover:text-white">
              ← Tools
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        {view === "dashboard" ? (
          <div className="space-y-5">
            {/* Readiness Score — inspired by Tech Passport */}
            <div className="bg-dark-800 rounded-2xl p-5 border border-dark-600">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Job Readiness Score</h2>
                <button onClick={refreshReadiness} className="text-xs text-brand-400 hover:text-brand-300">
                  Recalculate
                </button>
              </div>

              {readiness ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="32" fill="none" stroke="#1f2937" strokeWidth="8" />
                        <circle
                          cx="40" cy="40" r="32"
                          fill="none"
                          stroke="url(#scoreGrad)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(readiness.overall_score / 100) * 201} 201`}
                        />
                        <defs>
                          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-xl font-bold ${scoreColor(readiness.overall_score)}`}>
                          {readiness.overall_score}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{readiness.status}</p>
                      {readiness.next_actions?.[0] && (
                        <p className="text-gray-400 text-xs mt-1">Next: {readiness.next_actions[0]}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Knowledge", val: readiness.knowledge_coverage, max: 25 },
                      { label: "Self-Awareness", val: readiness.self_awareness, max: 25 },
                      { label: "Practice", val: readiness.practice_readiness, max: 25 },
                      { label: "Confidence", val: readiness.confidence_level, max: 25 },
                    ].map(({ label, val, max }) => (
                      <div key={label} className="bg-dark-700 rounded-xl p-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">{label}</span>
                          <span className="text-xs text-white">{val}/{max}</span>
                        </div>
                        <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${scoreGradient((val / max) * 100)}`}
                            style={{ width: `${(val / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-3">No score yet — click Recalculate after generating your guide</p>
                  <button
                    onClick={refreshReadiness}
                    className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg"
                  >
                    Calculate My Score
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {!guide ? (
                <button
                  onClick={generateGuide}
                  disabled={generatingGuide}
                  className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap"
                >
                  {generatingGuide ? <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" /> : <RefreshCw size={13} />}
                  Generate Guide
                </button>
              ) : (
                <button
                  onClick={() => setView("reading")}
                  className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap"
                >
                  <BookOpen size={13} />
                  Read Guide
                </button>
              )}
              <button
                onClick={generateAudio}
                disabled={generatingAudio || !guide}
                className="flex items-center gap-1.5 bg-dark-700 hover:bg-dark-600 disabled:opacity-40 text-gray-300 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap"
              >
                {generatingAudio ? <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" /> : <Volume2 size={13} />}
                {audioUrl ? "▶ Play Audio" : "Generate Audio"}
              </button>
              {audioUrl && (
                <a href={audioUrl} className="flex items-center gap-1.5 bg-green-900/40 text-green-400 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap">
                  <Volume2 size={13} />
                  Open MP3
                </a>
              )}
            </div>

            {/* Tool Grid */}
            <div className="grid grid-cols-2 gap-3">
              {TOOLS.filter(t => t.key !== "guide").map((tool, i) => (
                <motion.div
                  key={tool.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/role/${id}${tool.href}`}
                    className={`block rounded-2xl p-4 border ${tool.color} hover:opacity-90 transition-opacity`}
                  >
                    <tool.icon size={22} className="mb-2" />
                    <p className="text-white text-sm font-semibold">{tool.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{tool.desc}</p>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          // Reading view
          <div className="space-y-4">
            {/* Section Toggle */}
            <div className="flex gap-1">
              {[
                { key: "full", label: "Full Guide" },
                { key: "30min", label: "30 Min" },
                { key: "60min", label: "60 Min" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key as typeof activeSection)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeSection === key ? "bg-brand-600 text-white" : "bg-dark-700 text-gray-400 hover:text-white"
                  }`}
                >
                  {key !== "full" && <Clock size={11} />}
                  {label}
                </button>
              ))}
            </div>

            {guide ? (
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{getContent()}</ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No study guide yet</p>
                <button onClick={generateGuide} disabled={generatingGuide} className="bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold">
                  {generatingGuide ? "Generating..." : "Generate Now"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-800/95 backdrop-blur border-t border-dark-600 safe-bottom z-50">
        <div className="max-w-2xl mx-auto px-4 py-2 flex justify-around">
          <button onClick={() => setView("dashboard")} className={`flex flex-col items-center gap-0.5 py-1 px-3 ${view === "dashboard" ? "text-brand-400" : "text-gray-500"}`}>
            <TrendingUp size={18} />
            <span className="text-xs">Dashboard</span>
          </button>
          <button onClick={() => setView("reading")} className={`flex flex-col items-center gap-0.5 py-1 px-3 ${view === "reading" ? "text-brand-400" : "text-gray-500"}`}>
            <BookOpen size={18} />
            <span className="text-xs">Study Guide</span>
          </button>
          <Link href={`/role/${id}/mock`} className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-500">
            <Mic size={18} />
            <span className="text-xs">Mock</span>
          </Link>
          <Link href={`/role/${id}/flashcards`} className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-500">
            <Zap size={18} />
            <span className="text-xs">Cards</span>
          </Link>
          <Link href={`/role/${id}/interview-day`} className="flex flex-col items-center gap-0.5 py-1 px-3 text-gray-500">
            <Calendar size={18} />
            <span className="text-xs">Day Of</span>
          </Link>
        </div>
      </nav>

      <div className="h-20" /> {/* Bottom nav spacer */}
    </div>
  );
}
