"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, BookOpen, Mic, Volume2, Layers } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/types";

export default function HomePage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setRoles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-800/90 backdrop-blur border-b border-dark-600">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Interview Prep Engine</h1>
            <p className="text-xs text-gray-400">by Big Aus · MrCeesAI</p>
          </div>
          <Link
            href="/new-role"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
          >
            <Plus size={16} />
            New Role
          </Link>
        </div>
      </header>

      {/* Main Content */}
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
            {roles.map((role, i) => (
              <RoleCard key={role.id} role={role} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20"
    >
      <div className="w-20 h-20 bg-brand-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
        <BookOpen size={36} className="text-brand-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Ready to prep?</h2>
      <p className="text-gray-400 mb-8 max-w-sm mx-auto">
        Upload your resume, paste a job description, and Claude builds your personalized study guide in 45 seconds.
      </p>
      <Link
        href="/new-role"
        className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
      >
        <Plus size={20} />
        Add Your First Role
      </Link>

      <div className="mt-12 grid grid-cols-3 gap-4 text-center">
        {[
          { icon: BookOpen, label: "Study Guide", desc: "Top 20 Q&As + STAR stories" },
          { icon: Volume2, label: "Audio MP3", desc: "Listen at the gym" },
          { icon: Mic, label: "Mock Interview", desc: "Claude grades you live" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-dark-800 rounded-xl p-4">
            <Icon size={24} className="text-brand-400 mx-auto mb-2" />
            <p className="text-white text-sm font-medium">{label}</p>
            <p className="text-gray-500 text-xs mt-1">{desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function RoleCard({ role, index }: { role: Role; index: number }) {
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
        <span className="text-xs text-gray-500">
          {new Date(role.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link
          href={`/role/${role.id}`}
          className="flex items-center gap-1.5 bg-dark-700 hover:bg-dark-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          <BookOpen size={12} />
          Study Guide
        </Link>
        <Link
          href={`/role/${role.id}/audio`}
          className="flex items-center gap-1.5 bg-dark-700 hover:bg-dark-600 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          <Volume2 size={12} />
          Audio
        </Link>
        <Link
          href={`/role/${role.id}/mock`}
          className="flex items-center gap-1.5 bg-brand-900/40 hover:bg-brand-900/60 text-brand-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          <Mic size={12} />
          Mock Interview
        </Link>
        <Link
          href={`/role/${role.id}/combine`}
          className="flex items-center gap-1.5 bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          <Layers size={12} />
          Combine Roles
        </Link>
      </div>
    </motion.div>
  );
}
