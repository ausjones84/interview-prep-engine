export interface Role {
  id: string;
  user_id: string;
  title: string;
  company?: string;
  job_description?: string;
  resume_text?: string;
  created_at: string;
  updated_at: string;
}

export interface StudyGuide {
  id: string;
  role_id: string;
  user_id: string;
  role_overview?: string;
  acronyms_cheat_sheet?: string;
  top_questions?: InterviewQuestion[];
  star_scenarios?: StarScenario[];
  study_30min?: string;
  study_60min?: string;
  full_content?: string;
  created_at: string;
}

export interface InterviewQuestion {
  question: string;
  model_answer: string;
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface StarScenario {
  situation: string;
  task: string;
  action: string;
  result: string;
  skill?: string;
  from_resume?: boolean;
}

export interface AudioFile {
  id: string;
  role_id: string;
  study_guide_id?: string;
  user_id: string;
  title: string;
  file_url: string;
  file_size?: number;
  duration_seconds?: number;
  voice_id?: string;
  created_at: string;
}

export interface MockSession {
  id: string;
  role_id: string;
  user_id: string;
  questions?: MockQuestion[];
  responses?: MockResponse[];
  grades?: Grade[];
  overall_score?: number;
  feedback?: string;
  completed_at?: string;
  created_at: string;
}

export interface MockQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface MockResponse {
  question_id: string;
  response: string;
  timestamp: string;
}

export interface Grade {
  question_id: string;
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface CombinedRole {
  roles: Role[];
  combined_title: string;
  unified_guide?: StudyGuide;
}
