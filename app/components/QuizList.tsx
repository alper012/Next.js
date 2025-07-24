"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Quiz {
  _id: string;
  title: string;
  description: string;
  major: string;
  questions: any[];
  teacher: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface AttemptStats {
  major: string;
  totalAttempts: number;
  completedAttempts: number;
  activeAttempts: number;
  remainingAttempts: number;
}

export default function QuizList() {
  const { data: session } = useSession();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attemptStats, setAttemptStats] = useState<AttemptStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");
  const [majors, setMajors] = useState<string[]>([]);

  useEffect(() => {
    if (session?.user) {
      fetchQuizzes();
      fetchAttemptStats();
    }
  }, [session]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch("/api/quizzes");
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);

        // Extract unique majors
        const uniqueMajors = [
          ...new Set(data.map((quiz: Quiz) => quiz.major)),
        ] as string[];
        setMajors(uniqueMajors);
        if (uniqueMajors.length > 0) {
          setSelectedMajor(uniqueMajors[0]);
        }
      } else {
        setError("Failed to fetch quizzes");
      }
    } catch (error) {
      setError("An error occurred while fetching quizzes");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttemptStats = async () => {
    try {
      const response = await fetch("/api/quiz-attempts");
      if (response.ok) {
        const data = await response.json();
        setAttemptStats(data.attemptStats || []);
      }
    } catch (error) {
      console.error("Failed to fetch attempt stats:", error);
    }
  };

  const getAttemptStatsForMajor = (major: string) => {
    return attemptStats.find((stat) => stat.major === major);
  };

  const filteredQuizzes = selectedMajor
    ? quizzes.filter((quiz) => quiz.major === selectedMajor)
    : quizzes;

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Please sign in to view quizzes
          </h2>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-900">Loading quizzes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchQuizzes}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Available Quizzes
          </h1>

          {majors.length > 0 && (
            <div className="mb-6">
              <label
                htmlFor="major-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Filter by Major:
              </label>
              <select
                id="major-filter"
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Majors</option>
                {majors.map((major) => (
                  <option key={major} value={major}>
                    {major}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {filteredQuizzes.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No quizzes available
            </h3>
            <p className="text-gray-600">
              {selectedMajor
                ? `No quizzes found for ${selectedMajor} major.`
                : "No quizzes have been created yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredQuizzes.map((quiz) => {
              const stats = getAttemptStatsForMajor(quiz.major);
              const canTakeQuiz = !stats || stats.remainingAttempts > 0;

              return (
                <div
                  key={quiz._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {quiz.title}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {quiz.major}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {quiz.description}
                    </p>

                    <div className="text-sm text-gray-500 mb-4">
                      <p>Created by: {quiz.teacher.name}</p>
                      <p>Questions: {quiz.questions.length}</p>
                      {stats && (
                        <div className="mt-2">
                          <p>Your attempts: {stats.completedAttempts}/2</p>
                          <p>Remaining: {stats.remainingAttempts}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      {canTakeQuiz ? (
                        <Link
                          href={`/quiz?major=${quiz.major}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Take Quiz
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">
                          No attempts remaining
                        </span>
                      )}

                      <span className="text-xs text-gray-400">
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
