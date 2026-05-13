"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, Send, ChevronRight, Star, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Role, StudyGuide, MockQuestion, Grade } from "@/types";

type SessionState = "loading" | "ready" | "answering" | "grading" | "reviewing" | "complete";

export default function MockInterviewPage() {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentGrade, setCurrentGrade] = useState<Grade | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      setSessionState("ready");
    } catch (e) {
      console.error(e);
      setSessionState("ready");
    }
  }

  async function startSession() {
    if (!guide?.full_content) return;
    setSessionState("loading");
    try {
      const resp = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-questions",
          roleId: id,
          studyGuideContent: guide.full_content.substring(0, 3000),
        }),
      });
      const { session, questions: qs } = await resp.json();
      setQuestions(qs);
      setSessionId(session.id);
      setCurrentIndex(0);
      setGrades([]);
      setCurrentAnswer("");
      setSessionState("answering");
    } catch (e) {
      console.error(e);
      setSessionState("ready");
    }
  }

  async function submitAnswer() {
    if (!currentAnswer.trim() || !questions[currentIndex]) return;
    setSessionState("grading");
    
    try {
      const resp = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grade-response",
          question: questions[currentIndex].question,
          response: currentAnswer,
          roleContext: `${role?.title}${role?.company ? ` at ${role.company}` : ""}`,
        }),
      });
      const { grade } = await resp.json();
      const gradeWithId = { ...grade, question_id: questions[currentIndex].id };
      setCurrentGrade(gradeWithId);
      setGrades((prev) => [...prev, gradeWithId]);
      setSessionState("reviewing");
    } catch (e) {
      console.error(e);
      setSessionState("answering");
    }
  }

  function nextQuestion() {
    if (currentIndex + 1 >= questions.length) {
      finishSession();
    } else {
      setCurrentIndex((i) => i + 1);
      setCurrentAnswer("");
      setCurrentGrade(null);
      setSessionState("answering");
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }

  async function finishSession() {
    const overallScore = grades.length > 0
      ? Math.round(grades.reduce((sum, g) => sum + (g.score || 0), 0) / grades.length)
      : 0;
    
    if (sessionId) {
      await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete-session",
          sessionId,
          grades,
          overallScore,
          feedback: `Completed ${grades.length} questions. Average score: ${overallScore}/10`,
        }),
      });
    }
    setSessionState("complete");
  }

  const avgScore = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.score || 0), 0) / grades.length)
    : 0;

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <header className="sticky top-0 z-50 bg-dark-800/90 backdrop-blur border-b border-dark-600">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={`/role/${id}`} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Mock Interview</h1>
            {role && <p className="text-xs text-gray-400">{role.title}</p>}
          </div>
          {questions.length > 0 && sessionState !== "complete" && (
            <span className="text-sm text-gray-400">
              {Math.min(currentIndex + 1, questions.length)}/{questions.length}
            </span>
          )}
        </div>
        {questions.length > 0 && sessionState !== "complete" && (
          <div className="max-w-2xl mx-auto px-4 pb-3">
            <div className="h-1 bg-dark-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-brand-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          {sessionState === "loading" && (
            <motion.div key="loading" className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-400">Preparing your interview...</p>
              </div>
            </motion.div>
          )}

          {sessionState === "ready" && (
            <motion.div key="ready" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
              <div className="w-20 h-20 bg-brand-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mic size={36} className="text-brand-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Ready to Practice?</h2>
              <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                Claude will ask you 10 questions from your study guide and grade each response in real time.
              </p>
              {!guide && (
                <p className="text-yellow-400 text-sm mb-4">Generate a study guide first for best results</p>
              )}
              <button
                onClick={startSession}
                disabled={!guide}
                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors"
              >
                Start Mock Interview
              </button>
            </motion.div>
          )}

          {(sessionState === "answering" || sessionState === "grading") && questions[currentIndex] && (
            <motion.div key={`q-${currentIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="bg-dark-800 rounded-2xl p-5 border border-dark-600">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-brand-900/50 rounded-full flex items-center justify-center">
                    <span className="text-brand-400 text-sm font-bold">{currentIndex + 1}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">{questions[currentIndex].category}</span>
                    <p className="text-white font-medium mt-1 leading-relaxed">{questions[currentIndex].question}</p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-800 rounded-2xl border border-dark-600">
                <textarea
                  ref={textareaRef}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  disabled={sessionState === "grading"}
                  placeholder="Type your answer here... Use the STAR method for behavioral questions"
                  rows={8}
                  className="w-full bg-transparent px-5 py-4 text-white placeholder-gray-600 focus:outline-none resize-none text-sm"
                  autoFocus
                />
                <div className="px-5 py-3 border-t border-dark-600 flex items-center justify-between">
                  <span className="text-xs text-gray-500">{currentAnswer.split(" ").filter(Boolean).length} words</span>
                  <button
                    onClick={submitAnswer}
                    disabled={!currentAnswer.trim() || sessionState === "grading"}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {sessionState === "grading" ? (
                      <div className="animate-spin w-4 h-4 border border-white border-t-transparent rounded-full" />
                    ) : (
                      <Send size={14} />
                    )}
                    Submit
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {sessionState === "reviewing" && currentGrade && questions[currentIndex] && (
            <motion.div key={`grade-${currentIndex}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <ScoreCard grade={currentGrade} questionText={questions[currentIndex].question} answer={currentAnswer} />
              
              <button
                onClick={nextQuestion}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-xl font-semibold transition-colors"
              >
                {currentIndex + 1 >= questions.length ? "Finish Interview" : "Next Question"}
                <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {sessionState === "complete" && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
              <div className="text-center py-8">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${avgScore >= 7 ? "bg-green-900/40" : avgScore >= 5 ? "bg-yellow-900/40" : "bg-red-900/40"}`}>
                  <span className={`text-3xl font-bold ${avgScore >= 7 ? "text-green-400" : avgScore >= 5 ? "text-yellow-400" : "text-red-400"}`}>{avgScore}/10</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Interview Complete!</h2>
                <p className="text-gray-400">
                  {avgScore >= 7 ? "You're interview-ready! " : avgScore >= 5 ? "Getting there! " : "Keep practicing! "}
                  {grades.length} questions answered
                </p>
              </div>

              <div className="space-y-3">
                {grades.map((grade, i) => (
                  <div key={i} className="bg-dark-800 rounded-xl p-4 border border-dark-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Question {i + 1}</span>
                      <ScoreBadge score={grade.score} />
                    </div>
                    <p className="text-white text-sm leading-relaxed">{grade.feedback}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={startSession} className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
                  Try Again
                </button>
                <Link href={`/role/${id}`} className="flex-1 bg-dark-700 hover:bg-dark-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors text-center">
                  Back to Guide
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ScoreCard({ grade, questionText, answer }: { grade: Grade; questionText: string; answer: string }) {
  return (
    <div className="space-y-3">
      <div className="bg-dark-800 rounded-2xl p-5 border border-dark-600">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-300">Your Performance</span>
          <ScoreBadge score={grade.score} />
        </div>
        <p className="text-white text-sm leading-relaxed mb-4">{grade.feedback}</p>
        
        {grade.strengths?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-green-400 font-medium mb-1.5 flex items-center gap-1">
              <CheckCircle size={12} /> Strengths
            </p>
            <ul className="space-y-1">
              {grade.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-300 pl-3 border-l-2 border-green-700">{s}</li>
              ))}
            </ul>
          </div>
        )}
        
        {grade.improvements?.length > 0 && (
          <div>
            <p className="text-xs text-yellow-400 font-medium mb-1.5 flex items-center gap-1">
              <AlertCircle size={12} /> To Improve
            </p>
            <ul className="space-y-1">
              {grade.improvements.map((imp, i) => (
                <li key={i} className="text-sm text-gray-300 pl-3 border-l-2 border-yellow-700">{imp}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? "text-green-400 bg-green-900/40" : score >= 6 ? "text-yellow-400 bg-yellow-900/40" : "text-red-400 bg-red-900/40";
  return (
    <span className={`${color} px-2 py-0.5 rounded-md text-sm font-bold`}>
      {score}/10
    </span>
  );
}
