"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Layers, Plus, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/types";

export default function CombineRolesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set([id]));
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    try {
      const { data } = await supabase
        .from("roles")
        .select("*")
        .not("title", "like", "[Combined]%")
        .order("created_at", { ascending: false });
      if (data) setAllRoles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function toggleRole(roleId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId) && roleId !== id) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  }

  async function generateCombined() {
    if (selectedIds.size < 2) {
      setError("Select at least 2 roles");
      return;
    }
    setError("");
    setGenerating(true);

    try {
      const resp = await fetch("/api/combine-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleIds: [...selectedIds] }),
      });

      if (!resp.ok) {
        const { error: e } = await resp.json();
        throw new Error(e);
      }

      const { metaRole } = await resp.json();
      router.push(`/role/${metaRole.id}`);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to combine roles");
    } finally {
      setGenerating(false);
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
            <h1 className="text-lg font-bold text-white">Combine Roles</h1>
            <p className="text-xs text-gray-400">Build a unified study guide across multiple roles</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-dark-800 rounded-2xl p-4 border border-purple-800/40 mb-6">
          <div className="flex items-start gap-3">
            <Layers size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm font-medium">Multi-Role Prep Mode</p>
              <p className="text-gray-400 text-xs mt-1">
                Interviewing at multiple companies? Select all your active roles and Claude will create a single unified guide that covers overlapping skills, shared STAR stories, and what to prioritize first.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <p className="text-sm text-gray-400 font-medium">Select roles to combine ({selectedIds.size} selected)</p>
            {allRoles.map((role, i) => {
              const isSelected = selectedIds.has(role.id);
              const isCurrent = role.id === id;

              return (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => toggleRole(role.id)}
                  className={`w-full text-left bg-dark-800 rounded-xl p-4 border transition-all ${
                    isSelected
                      ? "border-purple-600 bg-purple-900/20"
                      : "border-dark-600 hover:border-dark-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{role.title}</p>
                      {role.company && <p className="text-gray-400 text-xs">{role.company}</p>}
                      {isCurrent && (
                        <span className="text-xs text-purple-400 mt-0.5 block">Current role</span>
                      )}
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? "border-purple-500 bg-purple-600" : "border-dark-500"
                    }`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                  </div>
                </motion.button>
              );
            })}

            {allRoles.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-3">No other roles yet</p>
                <Link
                  href="/new-role"
                  className="inline-flex items-center gap-2 text-brand-400 text-sm hover:text-brand-300"
                >
                  <Plus size={14} />
                  Add another role first
                </Link>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm mb-4">
            {error}
          </div>
        )}

        <button
          onClick={generateCombined}
          disabled={generating || selectedIds.size < 2}
          className="w-full flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold transition-colors"
        >
          {generating ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              Building combined guide...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Build Combined Guide ({selectedIds.size} roles)
            </>
          )}
        </button>
        
        {selectedIds.size < 2 && (
          <p className="text-center text-gray-500 text-xs mt-2">Select at least 2 roles to combine</p>
        )}
      </main>
    </div>
  );
}
