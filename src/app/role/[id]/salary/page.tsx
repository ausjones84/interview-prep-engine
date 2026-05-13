"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, DollarSign, TrendingUp, Sparkles } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/types";

export default function SalaryPage() {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [currentSalary, setCurrentSalary] = useState("");
  const [targetSalary, setTargetSalary] = useState("");
  const [offerReceived, setOfferReceived] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState("");
  const [playbook, setPlaybook] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("roles").select("*").eq("id", id).single().then(({ data }) => {
      if (data) setRole(data);
    });
  }, [id]);

  async function generate() {
    setLoading(true);
    try {
      const resp = await fetch("/api/salary-negotiation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleTitle: role?.title,
          company: role?.company,
          currentSalary,
          targetSalary,
          offerReceived,
          yearsExperience,
          location,
          skills,
        }),
      });
      const { playbook: p } = await resp.json();
      setPlaybook(p);
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
            <h1 className="text-lg font-bold text-white">Salary Negotiation Coach</h1>
            {role && <p className="text-xs text-gray-400">{role.title} · {role.company}</p>}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {!playbook ? (
          <>
            <div className="bg-dark-800 rounded-2xl p-4 border border-green-800/40">
              <div className="flex items-start gap-3">
                <DollarSign size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">Get Your Negotiation Playbook</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Claude will give you word-for-word scripts, market data, and tactical advice to maximize your offer. Most engineers leave $10K-$30K on the table by not negotiating.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-dark-800 rounded-2xl p-5 border border-dark-600 space-y-4">
              {[
                { label: "Current/Last Salary", state: currentSalary, setState: setCurrentSalary, placeholder: "e.g. $95,000" },
                { label: "Target Salary", state: targetSalary, setState: setTargetSalary, placeholder: "e.g. $135,000" },
                { label: "Offer Received (if any)", state: offerReceived, setState: setOfferReceived, placeholder: "e.g. $110,000 base + $20K bonus" },
                { label: "Years of Experience", state: yearsExperience, setState: setYearsExperience, placeholder: "e.g. 6 years" },
                { label: "Location / Remote", state: location, setState: setLocation, placeholder: "e.g. Atlanta, GA / Remote" },
                { label: "Key Skills & Certs", state: skills, setState: setSkills, placeholder: "e.g. AWS, Terraform, Kubernetes, CKA cert" },
              ].map(({ label, state, setState, placeholder }) => (
                <div key={label}>
                  <label className="text-sm text-gray-400 block mb-1">{label}</label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={generate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white py-4 rounded-xl font-semibold transition-colors"
            >
              {loading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <TrendingUp size={18} />
                  Generate My Negotiation Playbook
                </>
              )}
            </button>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-green-900/20 border border-green-700 rounded-xl px-4 py-3 flex items-center gap-3">
              <DollarSign size={18} className="text-green-400" />
              <p className="text-green-300 text-sm font-medium">Your personalized negotiation playbook is ready</p>
            </div>
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{playbook}</ReactMarkdown>
            </div>
            <button
              onClick={() => setPlaybook("")}
              className="w-full border border-dark-600 text-gray-400 hover:text-white py-3 rounded-xl text-sm transition-colors"
            >
              Regenerate with different inputs
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
