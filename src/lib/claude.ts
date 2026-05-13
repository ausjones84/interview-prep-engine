import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface StudyGuidePrompt {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  company?: string;
}

export interface CombinedGuidePrompt {
  roles: Array<{
    title: string;
    company?: string;
    jobDescription?: string;
    resumeText?: string;
  }>;
}

export async function generateStudyGuide(prompt: StudyGuidePrompt): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: buildStudyGuidePrompt(prompt),
      },
    ],
  });

  return (message.content[0] as { type: string; text: string }).text;
}

export async function generateCombinedGuide(prompt: CombinedGuidePrompt): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: buildCombinedGuidePrompt(prompt),
      },
    ],
  });

  return (message.content[0] as { type: string; text: string }).text;
}

export async function gradeMockResponse(
  question: string,
  response: string,
  roleContext: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You are an expert technical interviewer. Grade this interview response.

Role Context: ${roleContext}

Question: ${question}

Candidate Response: ${response}

Provide a JSON response with this structure:
{
  "score": <1-10 number>,
  "feedback": "<overall feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "ideal_elements": ["<what would make this perfect>"]
}

Be honest, specific, and actionable. Score 7+ means interview-ready.`,
      },
    ],
  });

  return (message.content[0] as { type: string; text: string }).text;
}

export async function generateMockQuestions(
  studyGuideContent: string,
  count: number = 10
): Promise<string> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Based on this study guide, generate ${count} interview questions. Include a mix of technical, behavioral, and situational questions.

Study Guide:
${studyGuideContent}

Return a JSON array with this structure:
[
  {
    "id": "q1",
    "question": "<question text>",
    "category": "technical|behavioral|situational|culture",
    "difficulty": "easy|medium|hard"
  }
]

Make questions realistic and likely to be asked in a real interview.`,
      },
    ],
  });

  return (message.content[0] as { type: string; text: string }).text;
}

function buildStudyGuidePrompt(prompt: StudyGuidePrompt): string {
  return `You are an expert interview coach and career strategist. Generate a comprehensive, personalized interview study guide.

## RESUME
${prompt.resumeText}

## JOB DESCRIPTION / ROLE
${prompt.jobDescription || prompt.jobTitle || "General interview prep"}
${prompt.company ? `Company: ${prompt.company}` : ""}

## INSTRUCTIONS
Generate a complete study guide with EXACTLY this structure (use these exact headers):

# ROLE OVERVIEW
2-3 paragraphs about what this role entails, the company if known, key responsibilities, and what success looks like. Be specific to the job description.

# ACRONYMS CHEAT SHEET
List the top 15-20 technical acronyms, tools, and buzzwords from the job description with brief explanations. Format as: **ACRONYM** — definition

# TOP 20 INTERVIEW QUESTIONS WITH MODEL ANSWERS
Number each Q&A. Include questions about: technical skills, past experience, behavioral scenarios, culture fit, and role-specific challenges. Model answers should be 150-250 words each, referencing the candidate's actual background when relevant.

# 10 STAR SCENARIOS (FROM YOUR RESUME)
Pull 10 specific stories from the candidate's resume formatted as STAR (Situation, Task, Action, Result). Each should be 3-4 sentences per section. Make these interview-ready.

# 30-MINUTE STUDY FORMAT
A focused 30-min study plan. What to review, in what order, what to memorize.

# 60-MINUTE STUDY FORMAT  
An expanded 60-min study plan. Includes mock Q&A rounds, deep dives, and confidence-building exercises.

Be specific, practical, and calibrated to this exact role and this exact candidate's background.`;
}

function buildCombinedGuidePrompt(prompt: CombinedGuidePrompt): string {
  const rolesText = prompt.roles.map((r, i) => `
## ROLE ${i + 1}: ${r.title}${r.company ? ` at ${r.company}` : ""}
${r.jobDescription ? `Job Description: ${r.jobDescription}` : ""}
${r.resumeText ? `Resume Context: ${r.resumeText}` : ""}
`).join("\n");

  return `You are an expert interview coach. The candidate is preparing for MULTIPLE roles simultaneously. Create a UNIFIED study guide that covers all roles efficiently.

${rolesText}

## INSTRUCTIONS
Create a combined study guide that:
1. Identifies overlapping skills and knowledge across all roles
2. Creates a unified ACRONYMS CHEAT SHEET that covers all roles
3. Lists TOP 25 QUESTIONS most likely to appear across all these roles
4. Identifies 10 STAR SCENARIOS that are relevant to multiple roles
5. Creates a PRIORITY MATRIX (what to study first based on overlap)
6. Provides a 45-MINUTE COMBINED STUDY FORMAT
7. Notes role-specific differences to be aware of in each interview

Focus on efficiency — what knowledge/stories/skills serve the candidate best across ALL roles.`;
}
