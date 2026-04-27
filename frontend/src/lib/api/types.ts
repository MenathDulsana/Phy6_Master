// Shared types matching backend entities

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  role: "STUDENT" | "TEACHER" | "TUTOR" | "ACCOUNTANT" | "ADMIN";
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  teacher?: User;
  batch?: string;
  subject?: string;
  type?: string;
  imageUrl?: string;
}

export interface TimetableSlot {
  id: number;
  course: Course;
  dayOfWeek: string; // "MONDAY", "TUESDAY", etc.
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
  location?: string;
  notes?: string;
  meetingLink?: string;
}

export interface TimetableSlotDTO {
  courseId: number;
  dayOfWeek: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  location?: string;
  notes?: string;
  meetingLink?: string;
}

export interface Lesson {
  id: number;
  title: string;
  content?: string;
  month?: string;   // "YYYY-MM" e.g. "2026-03"
  courseId?: number; // exposed from backend @JsonProperty
}

export interface LearningMaterial {
  id: number;
  title: string;
  type: "PDF" | "VIDEO" | "LINK" | "NOTE";
  url: string;
  lesson?: Lesson;
}

export interface Student {
  id: number;
  user: User;
  studentId: string;
  enrollmentNumber?: string;
  school?: string;
  batch?: string;
  stream?: string;
  address?: string;
  parentName?: string;
  parentPhoneNumber?: string;
  enrollmentDate?: string;
}

export interface Teacher {
  id: number;
  user: User;
  employeeId: string;
  email?: string;
  qualification?: string;
  specialization?: string;
  department?: string;
  experience?: string;
  office?: string;
  officePhoneNumber?: string;
  joiningDate?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  courseId: number;
  courseName: string;
  teacherId: number;
  teacherName: string;
  createdAt: string;   // ISO date-time from backend LocalDateTime
  updatedAt: string;   // ISO date-time from backend LocalDateTime
}

export interface CreateAnnouncementRequest {
  courseId: number;
  teacherId: number;
  title: string;
  content: string;
}

export interface UpdateAnnouncementRequest {
  teacherId: number;
  title: string;
  content: string;
}

export type QuizStatus = "DRAFT" | "PUBLISHED";

export interface QuizOption {
  id?: number;
  text: string;
  correct: boolean;
}

export interface QuizQuestion {
  id?: number;
  text: string;
  options: QuizOption[];
}

export interface QuizSummary {
  id: number;
  title: string;
  courseId: number;
  lessonId?: number;
  status: QuizStatus;
  createdAt?: string;
  updatedAt?: string;
  questions?: QuizQuestion[];
}

export interface QuizSessionResponse {
  id: number;
  studentId: number;
  quizId: number;
  status: string;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  score?: number;
  completedAt?: string;
  hasAnswers?: boolean;
}

export interface PlayOption {
  id: number;
  text: string;
}

export interface PlayQuestion {
  id: number;
  text: string;
  options: PlayOption[];
}

export interface CurrentQuestionResponse {
  sessionId: number;
  questionIndex: number;
  totalQuestions: number;
  lastQuestion?: boolean;
  isLastQuestion?: boolean;
  question: PlayQuestion;
  selectedOptionId?: number;
}

export interface QuizResultResponse {
  id: number;
  sessionId: number;
  studentId: number;
  quizId: number;
  correctAnswersCount: number;
  totalQuestions: number;
  scorePercentage: number;
  status: string;
  evaluatedAt?: string;
}

export interface QuizResultSummary {
  quizId: number;
  quizTitle: string;
  scorePercentage: number;
  correctAnswers: number;
  totalQuestions: number;
  status: string;
  attemptedAt: string;
}

export interface PerformanceInsight {
  label: string;
  accuracyPercentage: number;
  attempts: number;
  correctCount: number;
}

export interface StudentDashboardResponse {
  totalQuizzes: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  recentAttempts: QuizResultSummary[];
  strengths: PerformanceInsight[];
  weaknesses: PerformanceInsight[];
}

export interface QuizAttempt {
  attemptNumber: number;
  status: string;
  scorePercentage: number;
  correctAnswers: number;
  totalQuestions: number;
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
}

export interface QuizQuestionSummary {
  questionId: number;
  questionIndex: number;
  answered: boolean;
  selectedOptionId?: number;
}

export interface QuizSessionSummary {
  sessionId: number;
  totalQuestions: number;
  questions: QuizQuestionSummary[];
}

export interface QuizReviewOption {
  id: number;
  text: string;
  correct: boolean;
}

export interface QuizReviewQuestion {
  id: number;
  text: string;
  questionIndex: number;
  selectedOptionId?: number;
  options: QuizReviewOption[];
}

export interface QuizReviewResponse {
  sessionId: number;
  quizId: number;
  totalQuestions: number;
  questions: QuizReviewQuestion[];
}
