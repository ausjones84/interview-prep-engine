"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw, Check, X, Zap } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/types";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: number;
  mastered: boolean;
  seenCount: number;
}

export default function FlashcardsPage() {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sessionStats, setSessionStats] = useState({ got_it: 0, missed: 0, mastered: 0 });
  const [filter, setFilter] = useState<"all" | "unmastered" | "hard">("unmastered");

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [roleRes] = await Promise.all([
        supabase.from("roles").select("*").eq("id", id).single(),
      ]);
      if (roleRes.data) setRole(roleRes.data);

      // Load flashcards from study guide
      const { data: guideData } = await supabase
        .from("study_guides")
        .select("full_content")
        .eq("role_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (guideData?.full_content) {
        await generateCards(guideData.full_content);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function generateCards(guideContent: string) {
    setGenerating(true);
    try {
      const resp = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guideContent, roleId: id }),
      });
      if (resp.ok) {
        const { cards: newCards } = await resp.json();
        setCards(newCards);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  const filteredCards = cards.filter(c => {
    if (filter === "unmastered") return !c.mastered;
    if (filter === "hard") return c.difficulty >= 3;
    return true;
  });

  const currentCard = filteredCards[currentIndex];

  function handleGotIt() {
    if (!currentCard) return;
    setCards(prev => prev.map(c => c.id === currentCard.id ? { ...c, seenCount: c.seenCount + 1 } : c));
    setSessionStats(s => ({ ...s, got_it: s.got_it + 1 }));
    next();
  }

  function handleMissed() {
    if (!currentCard) return;
    setCards(prev => prev.map(c => c.id === currentCard.id ? { ...c, difficulty: Math.min(5, c.difficulty + 1), seenCount: c.seenCount + 1 } : c));
    setSessionStats(s => ({ ...s, missed: s.missed + 1 }));
    next();
  }

  function handleMastered() {
    if (!currentCard) return;
    setCards(prev => prev.map(c => c.id === currentCard.id ? { ...c, mastered: true } : c));
    setSessionStats(s => ({ ...s, mastered: s.mastered + 1, got_it: s.got_it + 1 }));
    next();
  }

  function next() {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(i => (i + 1) % Math.max(1, filteredCards.length));
    }, 150);
  }

  function prev() {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(i => (i - 1 + filteredCards.length) % Math.max(1, filteredCards.length));
    }, 150);
  }

  const masteredCount = cards.filter(c => c.mastered).length;
  const progress = cards.length > 0 ? (masteredCount / cards.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="sticky top-0 z-50 bg-dark-800/90 backdrop-blur border-b border-dark-600">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={`/role/${id}`} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Flashcards</h1>
            {role && <p className="text-xs text-gray-400">{role.title}</p>}
          </div>
          {cards.length > 0 && (
            <span className="text-xs text-gray-400">{masteredCount}/{cards.length} mastered</span>
          )}
        </div>

        {cards.length > 0 && (
          <div className="max-w-2xl mx-auto px-4 pb-3">
            <div className="flex gap-2 mb-2">
              {["all", "unmastered", "hard"].map(f => (
                <button
                  key={f}
                  onClick={() => { setFilter(f as typeof filter); setCurrentIndex(0); setIsFlipped(false); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-brand-600 text-white" : "bg-dark-700 text-gray-400"}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-brand-500 to-green-500 rounded-full"
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading || generating ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full" />
            <p className="text-gray-400 text-sm">{generating ? "Generating flashcards from your study guide..." : "Loading..."}</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-16">
            <Zap size={40} className="text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              {filter === "unmastered" ? "You mastered all cards! 🎉" : "No cards in this filter"}
            </h2>
            <p className="text-gray-400 mb-4">
              {filter === "unmastered" ? "Switch to 'All' to review mastered cards" : "Try a different filter"}
            </p>
            <button onClick={() => { setFilter("all"); setCurrentIndex(0); }} className="bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold">
              View All Cards
            </button>
          </div>
        ) : currentCard ? (
          <div className="space-y-4">
            {/* Session Stats */}
            <div className="flex justify-center gap-6 text-sm">
              <span className="text-green-400">✓ {sessionStats.got_it}</span>
              <span className="text-red-400">✗ {sessionStats.missed}</span>
              <span className="text-yellow-400">⭐ {sessionStats.mastered}</span>
              <span className="text-gray-500">{currentIndex + 1}/{filteredCards.length}</span>
            </div>

            {/* Card */}
            <div className="relative h-72 cursor-pointer" onClick={() => setIsFlipped(f => !f)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isFlipped ? "back" : "front"}
                  initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute inset-0 rounded-2xl p-6 flex flex-col justify-between border ${
                    isFlipped
                      ? "bg-dark-700 border-brand-600"
                      : "bg-dark-800 border-dark-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${
                      isFlipped ? "text-brand-300 bg-brand-900/40" : "text-gray-500 bg-dark-700"
                    }`}>
                      {isFlipped ? "Answer" : currentCard.category}
                    </span>
                    <span className="text-gray-600 text-xs">Tap to flip</span>
                  </div>

                  <div className="flex-1 flex items-center justify-center py-4">
                    <p className={`text-center leading-relaxed ${isFlipped ? "text-gray-200 text-sm" : "text-white font-semibold text-base"}`}>
                      {isFlipped ? currentCard.back : currentCard.front}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(d => (
                        <div key={d} className={`w-1.5 h-1.5 rounded-full ${d <= currentCard.difficulty ? "bg-orange-400" : "bg-dark-600"}`} />
                      ))}
                    </div>
                    {currentCard.mastered && (
                      <span className="text-xs text-yellow-400">⭐ Mastered</span>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Actions */}
            {isFlipped ? (
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleMissed}
                  className="flex flex-col items-center gap-1 bg-red-900/30 hover:bg-red-900/50 border border-red-700/50 text-red-400 py-3 rounded-xl transition-colors"
                >
                  <X size={20} />
                  <span className="text-xs font-medium">Missed</span>
                </button>
                <button
                  onClick={handleMastered}
                  className="flex flex-col items-center gap-1 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-700/50 text-yellow-400 py-3 rounded-xl transition-colors"
                >
                  <Zap size={20} />
                  <span className="text-xs font-medium">Mastered</span>
                </button>
                <button
                  onClick={handleGotIt}
                  className="flex flex-col items-center gap-1 bg-green-900/30 hover:bg-green-900/50 border border-green-700/50 text-green-400 py-3 rounded-xl transition-colors"
                >
                  <Check size={20} />
                  <span className="text-xs font-medium">Got it</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-4 items-center justify-center">
                <button onClick={prev} className="text-gray-400 hover:text-white p-2">
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setIsFlipped(true)}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  Reveal Answer
                </button>
                <button onClick={next} className="text-gray-400 hover:text-white p-2">
                  <ChevronRight size={24} />
                </button>
              </div>
            )}

            <button
              onClick={() => { setCurrentIndex(0); setIsFlipped(false); setSessionStats({ got_it: 0, missed: 0, mastered: 0 }); }}
              className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 text-sm py-2"
            >
              <RotateCcw size={14} />
              Restart deck
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
