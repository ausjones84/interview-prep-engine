"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, BookOpen, Mic, Volume2, Layers, Zap, DollarSign, Globe, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/types";

export default function HomePage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRoles(); }, []);

  async function loadRoles() {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setRoles(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-6">
      <header className="sticky top-0 z-50 bg-dark-800/90 backdrop-blur border-b border-dark-600">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Interview Prep Engine</h1>
            <p className="text-xs text-gray-400">by Big Aus - MrCeesAI</p>
          </div>
          <Link href="/new-role" className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm">
            <Plus size={16} />
            New Role
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : roles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-200">Your Roles</h2>
              <span className="text-sm text-gray-400">{roles.length} role{roles.length !== 1 ? "s" : ""}</span>
            </div>
            {roles.map((role, i) => <RoleCard key={role.id} role={role} index={i} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  const features = [
    { icon: BookOpen, label: "Study Guide", desc: "Top 20 Q&As + STAR stories", color: "text-blue-400" },
    { icon: Volume2, label: "Audio MP3", desc: "Listen at the gym", color: "text-green-400" },
    { icon: Mic, label: "Mock Interview", desc: "Claude grades you 1-10", color: "text-purple-400" },
    { icon: Zap, label: "Flashcards", desc: "30 spaced repetition cards", color: "text-yellow-400" },
    { icon: Globe, label: "Company Intel", desc: "Culture, stack, smart Qs", color: "text-cyan-400" },
    { icon: DollarSign, label: "Salary Coach", desc: "Word-for-word scripts", color: "text-emerald-400" },
    { icon: Calendar, label: "Interview Day", desc: "Countdown + checklist", color: "text-orange-400" },
    { icon: Layers, label: "Combine Roles", desc: "Unified multi-role guide", color: "text-pink-400" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
      <div className="w-20 h-20 bg-brand-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
        <TrendingUp size={36} className="text-brand-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Ready to become a superstar?</h2>
      <p className="text-gray-400 mb-8 max-w-sm mx-auto text-sm">
        Upload your resume, paste a job description, and Claude builds your personalized study guide in 45 seconds.
      </p>
      <Link href="/new-role" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
        <Plus size={20} />
        Add Your First Role
      </Link>

      <div className="mt-10 grid grid-cols-2 gap-3 text-left">
        {features.map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="bg-dark-800 rounded-xl p-3 border border-dark-600">
            <Icon size={18} className={color + " mb-1.5"} />
            <p className="text-white text-sm font-medium">{label}</p>
            <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function RoleCard({ role, index }: { role: Role; index: number }) {
  const tools = [
    { icon: BookOpen, label: "Study", href: "", color: "bg-dark-700 hover:bg-dark-600 text-gray-300" },
    { icon: Volume2, label: "Audio", href: "/audio", color: "bg-dark-700 hover:bg-dark-600 text-gray-300" },
    { icon: Mic, label: "Mock", href: "/mock", color: "bg-purple-900/40 hover:bg-purple-900/60 text-purple-300" },
    { icon: Zap, label: "Cards", href: "/flashcards", color: "bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-300" },
    { icon: Globe, label: "Intel", href: "/research", color: "bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-300" },
    { icon: DollarSign, label: "Salary", href: "/salary", color: "bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300" },
    { icon: Calendar, label: "Day Of", href: "/interview-day", color: "bg-orange-900/40 hover:bg-orange-900/60 text-orange-300" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-dark-800 rounded-2xl p-4 border border-dark-600 hover:border-brand-600/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white">{role.title}</h3>
          {role.company && <p className="text-sm text-gray-400">{role.company}</p>}
        </div>
        <span className="text-xs text-gray-500">{new Date(role.created_at).toLocaleDateString()}</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {tools.map(({ icon: Icon, label, href, color }) => (
          <Link
            key={label}
            href={"/role/" + role.id + href}
            className={"flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors " + color}
          >
            <Icon size={11} />
            {label}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
