"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, Clock, CheckCircle, Circle, Zap, Star, Trophy } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/types";

const CHECKLIST_ITEMS = [
  { id: "study_guide", label: "Read study guide (focus on role overview + top 5 questions)", category: "prep" },
  { id: "star_review", label: "Review your 10 STAR scenarios out loud", category: "prep" },
  { id: "acronyms", label: "Flash through the acronyms cheat sheet", category: "prep" },
  { id: "mock_5", label: "Do a 5-question mock interview", category: "practice" },
  { id: "company_research", label: "Re-read company intelligence brief", category: "research" },
  { id: "questions_ready", label: "Prepare your 3-5 questions to ask them", category: "research" },
  { id: "outfit", label: "Outfit ready / background clean (video)", category: "logistics" },
  { id: "tech_check", label: "Test mic, camera, internet speed", category: "logistics" },
  { id: "linkedin", label: "LinkedIn profile updated + profile pic professional", category: "logistics" },
  { id: "resume_printed", label: "Resume printed / digital copy ready", category: "logistics" },
  { id: "sleep", label: "8 hours sleep the night before", category: "mindset" },
  { id: "power_pose", label: "2-min power pose + deep breathing before interview", category: "mindset" },
  { id: "affirmations", label: ""I am prepared. I am the candidate they need."", category: "mindset" },
  { id: "audio_listen", label: "Listen to audio study guide during commute/before", category: "prep" },
  { id: "salary_ready", label: "Know your number + negotiation floor", category: "salary" },
];

export default function InterviewDayPage() {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    supabase.from("roles").select("*").eq("id", id).single().then(({ data }) => {
      if (data) setRole(data);
    });
    // Load saved checklist from localStorage
    const saved = localStorage.getItem(`interview-checklist-${id}`);
    if (saved) setChecked(new Set(JSON.parse(saved)));
    const savedDate = localStorage.getItem(`interview-date-${id}`);
    if (savedDate) setInterviewDate(savedDate);
    const savedTime = localStorage.getItem(`interview-time-${id}`);
    if (savedTime) setInterviewTime(savedTime);
  }, [id]);

  useEffect(() => {
    if (interviewDate) {
      const dateStr = interviewTime ? `${interviewDate}T${interviewTime}` : interviewDate;
      const target = new Date(dateStr);
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff > 0) {
        setDaysLeft(Math.floor(diff / (1000 * 60 * 60 * 24)));
        setHoursLeft(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      } else {
        setDaysLeft(0);
        setHoursLeft(0);
      }
      localStorage.setItem(`interview-date-${id}`, interviewDate);
      if (interviewTime) localStorage.setItem(`interview-time-${id}`, interviewTime);
    }
  }, [interviewDate, interviewTime, id]);

  function toggleCheck(itemId: string) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else {
        next.add(itemId);
        if (next.size === CHECKLIST_ITEMS.length) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      }
      localStorage.setItem(`interview-checklist-${id}`, JSON.stringify([...next]));
      return next;
    });
  }

  const progress = (checked.size / CHECKLIST_ITEMS.length) * 100;
  const categories = {
    prep: { label: "📚 Prep Work", color: "text-blue-400" },
    practice: { label: "🎯 Practice", color: "text-purple-400" },
    research: { label: "🔍 Research", color: "text-yellow-400" },
    logistics: { label: "📋 Logistics", color: "text-green-400" },
    mindset: { label: "🧠 Mindset", color: "text-orange-400" },
    salary: { label: "💰 Salary", color: "text-emerald-400" },
  };

  const groupedItems = Object.entries(categories).map(([cat, info]) => ({
    ...info,
    items: CHECKLIST_ITEMS.filter(i => i.category === cat),
  }));

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="sticky top-0 z-50 bg-dark-800/90 backdrop-blur border-b border-dark-600">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={`/role/${id}`} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Interview Day Prep</h1>
            {role && <p className="text-xs text-gray-400">{role.title}</p>}
          </div>
          <span className="text-sm text-green-400 font-medium">{checked.size}/{CHECKLIST_ITEMS.length}</span>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-500 via-purple-500 to-green-500 rounded-full"
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Celebration */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="bg-brand-900 border-2 border-brand-500 rounded-2xl p-8 text-center shadow-2xl">
                <Trophy size={48} className="text-yellow-400 mx-auto mb-3" />
                <p className="text-2xl font-bold text-white">YOU ARE READY!</p>
                <p className="text-brand-300 mt-1">Go crush that interview! 🚀</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Countdown */}
        <div className="bg-dark-800 rounded-2xl p-5 border border-dark-600">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Calendar size={14} />
            Interview Date
          </h2>
          <div className="flex gap-3 mb-4">
            <input
              type="date"
              value={interviewDate}
              onChange={e => setInterviewDate(e.target.value)}
              className="flex-1 bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 text-sm"
            />
            <input
              type="time"
              value={interviewTime}
              onChange={e => setInterviewTime(e.target.value)}
              className="flex-1 bg-dark-700 border border-dark-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 text-sm"
            />
          </div>
          {daysLeft !== null && (
            <div className="flex gap-4 justify-center">
              <div className="text-center">
                <p className={`text-3xl font-bold ${daysLeft <= 1 ? "text-red-400" : daysLeft <= 3 ? "text-yellow-400" : "text-brand-400"}`}>{daysLeft}</p>
                <p className="text-xs text-gray-500">days</p>
              </div>
              <div className="text-center">
                <p className={`text-3xl font-bold ${daysLeft <= 1 ? "text-red-400" : "text-gray-400"}`}>{hoursLeft}</p>
                <p className="text-xs text-gray-500">hours</p>
              </div>
              <div className="text-center">
                <p className={`text-xl font-bold ${daysLeft === 0 ? "text-red-400 animate-pulse" : "text-gray-600"}`}>
                  {daysLeft === 0 ? "TODAY" : daysLeft <= 1 ? "TOMORROW" : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Checklist by category */}
        {groupedItems.map(({ label, color, items }) => (
          <div key={label} className="bg-dark-800 rounded-2xl border border-dark-600 overflow-hidden">
            <div className="px-4 py-3 border-b border-dark-600">
              <h3 className={`text-sm font-semibold ${color}`}>{label}</h3>
            </div>
            <div className="divide-y divide-dark-700">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700/50 transition-colors text-left"
                >
                  {checked.has(item.id) ? (
                    <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-gray-600 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${checked.has(item.id) ? "text-gray-500 line-through" : "text-gray-200"}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Power reminder */}
        <div className="bg-gradient-to-r from-brand-900/40 to-purple-900/40 rounded-2xl p-5 border border-brand-700/40 text-center">
          <Zap size={24} className="text-yellow-400 mx-auto mb-2" />
          <p className="text-white font-semibold">"The interview starts before you walk in the door."</p>
          <p className="text-gray-400 text-sm mt-1">Your preparation separates you from every other candidate.</p>
        </div>
      </main>
    </div>
  );
}
