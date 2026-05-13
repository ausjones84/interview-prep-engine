"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Globe, Sparkles, Building2 } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/types";

export default function ResearchPage() {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [research, setResearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("roles").select("*").eq("id", id).single().then(({ data }) => {
      if (data) {
        setRole(data);
      }
    });
  }, [id]);

  async function generateResearch() {
    if (!role) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/company-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: role.company,
          jobTitle: role.title,
          jobDescription: role.job_description,
        }),
      });
      const { research: r } = await resp.json();
      setResearch(r);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="sticky top-0 z-50 bg-dark-800/90 backdrop-blur border-b border-dark-600">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={`/role/${id}`} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Company Intelligence</h1>
            {role && <p className="text-xs text-gray-400">{role.company || role.title}</p>}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {!research ? (
          <>
            <div className="bg-dark-800 rounded-2xl p-4 border border-blue-800/40">
              <div className="flex items-start gap-3">
                <Globe size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">Know Before You Go</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Claude will analyze the company, their likely tech stack, culture signals from the JD, smart questions to ask, salary ranges, and how to position yourself. Walk in knowing more than 95% of candidates.
                  </p>
                </div>
              </div>
            </div>

            {role && (
              <div className="bg-dark-800 rounded-2xl p-4 border border-dark-600 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-gray-500" />
                  <span className="text-white text-sm font-medium">{role.company || "Company not set"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-gray-500" />
                  <span className="text-gray-400 text-sm">{role.title}</span>
                </div>
                {!role.company && (
                  <p className="text-yellow-400 text-xs">Add a company name to your role for better research results</p>
                )}
              </div>
            )}

            <button
              onClick={generateResearch}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white py-4 rounded-xl font-semibold transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Researching company...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Company Intelligence Brief
                </>
              )}
            </button>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-700 rounded-xl px-4 py-3 flex items-center gap-3">
              <Globe size={18} className="text-blue-400" />
              <p className="text-blue-300 text-sm font-medium">Company intelligence brief ready</p>
            </div>
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{research}</ReactMarkdown>
            </div>
            <button
              onClick={() => setResearch("")}
              className="w-full border border-dark-600 text-gray-400 hover:text-white py-3 rounded-xl text-sm transition-colors"
            >
              Regenerate
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
