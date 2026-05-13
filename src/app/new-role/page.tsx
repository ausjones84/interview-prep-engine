"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, ArrowLeft, Sparkles, Building2, Briefcase } from "lucide-react";
import Link from "next/link";

export default function NewRolePage() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "creating-role" | "generating-guide" | "done">("idle");
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) setResumeFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
    },
    maxFiles: 1,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobTitle.trim()) {
      setError("Job title is required");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // Step 1: Extract resume text if file uploaded
      let resumeText = "";
      if (resumeFile) {
        setStep("creating-role");
        const formData = new FormData();
        formData.append("file", resumeFile);
        const parseResp = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });
        if (parseResp.ok) {
          const { text } = await parseResp.json();
          resumeText = text;
        }
      }

      // Step 2: Create role
      setStep("creating-role");
      const roleResp = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: jobTitle,
          company,
          jobDescription,
          resumeText,
        }),
      });

      if (!roleResp.ok) {
        const { error } = await roleResp.json();
        throw new Error(error);
      }

      const { role } = await roleResp.json();

      // Step 3: Generate study guide
      setStep("generating-guide");
      const guideResp = await fetch("/api/generate-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: role.id,
          resumeText,
          jobDescription,
          jobTitle,
          company,
        }),
      });

      if (!guideResp.ok) {
        const { error } = await guideResp.json();
        throw new Error(error);
      }

      setStep("done");
      setTimeout(() => router.push(`/role/${role.id}`), 500);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Something went wrong");
      setStep("idle");
    } finally {
      setLoading(false);
    }
  }

  const statusMessages = {
    idle: "",
    "creating-role": "Creating your role profile...",
    "generating-guide": "Claude is building your personalized study guide (~45 sec)...",
    done: "Done! Redirecting...",
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="sticky top-0 z-50 bg-dark-800/90 backdrop-blur border-b border-dark-600">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-white">New Role</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Job Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-dark-800 rounded-2xl p-5 border border-dark-600">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">Role Details</h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Job Title *</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Cloud Engineer"
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl pl-9 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Company (optional)</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Anata, Google, AWS"
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl pl-9 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Job Description */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-dark-800 rounded-2xl p-5 border border-dark-600">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Job Description</h2>
            <p className="text-xs text-gray-500 mb-3">Paste the full JD for the most personalized guide</p>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={8}
              className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 text-sm resize-none"
            />
          </motion.div>

          {/* Resume Upload */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-dark-800 rounded-2xl p-5 border border-dark-600">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Resume (Optional)</h2>
            <p className="text-xs text-gray-500 mb-3">Upload to get STAR scenarios pulled from YOUR experience</p>
            
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-brand-500 bg-brand-900/20" : "border-dark-600 hover:border-dark-500"
              } ${resumeFile ? "bg-green-900/10 border-green-700" : ""}`}
            >
              <input {...getInputProps()} />
              {resumeFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText size={24} className="text-green-400" />
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">{resumeFile.name}</p>
                    <p className="text-gray-400 text-xs">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload size={32} className="text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Drop your resume here or tap to browse</p>
                  <p className="text-gray-600 text-xs mt-1">PDF or DOCX</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Loading Status */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-brand-900/30 border border-brand-700 rounded-xl px-4 py-4 text-center"
            >
              <div className="flex items-center justify-center gap-3">
                <Sparkles size={18} className="text-brand-400 animate-pulse" />
                <p className="text-brand-300 text-sm">{statusMessages[step]}</p>
              </div>
            </motion.div>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-base transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Sparkles size={18} />
                Generate Study Guide
              </>
            )}
          </motion.button>
        </form>
      </main>
    </div>
  );
}
