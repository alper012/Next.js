export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  major: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizState {
  currentQuestionIndex: number;
  score: number;
  showResults: boolean;
  answers: number[];
}

export interface QuizAttempt {
  id: number;
  userId: string;
  score: number;
  totalQuestions: number;
  major: string;
  completedAt: Date;
}

export interface UserRole {
  id: string;
  role: "student" | "teacher" | "admin";
  major?: string;
}

export interface QuizFilter {
  major?: string;
}
