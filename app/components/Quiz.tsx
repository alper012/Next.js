"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Question, QuizFilter, UserRole } from "../types/quiz";

export default function Quiz() {
  const { data: session } = useSession();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [filters, setFilters] = useState<QuizFilter>({});
  const [availableMajors, setAvailableMajors] = useState<string[]>([]);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(
    null
  );

  useEffect(() => {
    const fetchUserRole = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/user/role");
          if (response.ok) {
            const roleData = await response.json();
            setUserRole(roleData);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
    };

    const fetchMetadata = async () => {
      try {
        const response = await fetch("/api/quiz/metadata");
        if (response.ok) {
          const { majors } = await response.json();
          setAvailableMajors(majors);
        }
      } catch (error) {
        console.error("Error fetching metadata:", error);
      }
    };

    fetchUserRole();
    fetchMetadata();
  }, [session]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Fetch available quizzes and pick the latest for the selected major
        const quizzesRes = await fetch(`/api/quizzes`);
        if (!quizzesRes.ok) throw new Error("Failed to fetch quizzes");
        const quizzes = await quizzesRes.json();
        const filtered = filters.major
          ? quizzes.filter((q: any) => q.major === filters.major)
          : quizzes;
        if (!filtered.length) {
          setShuffledQuestions([]);
          setActiveQuizId(null);
          setLoading(false);
          return;
        }
        // Choose most recent quiz
        filtered.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const selectedQuiz = filtered[0];
        setActiveQuizId(selectedQuiz._id);

        const quizQuestions: Question[] = selectedQuiz.questions.map(
          (q: any) => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            major: selectedQuiz.major,
            createdBy: q.createdBy ?? "",
            createdAt: q.createdAt,
            updatedAt: q.updatedAt,
          })
        );

        setShuffledQuestions(
          [...quizQuestions].sort(() => Math.random() - 0.5)
        );
        setLoading(false);
      } catch (error) {
        setError("Failed to load questions");
        console.error("Error fetching questions:", error);
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [filters]);

  const handleAnswer = async (selectedOption: number) => {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];

    // For non-logged-in users, calculate score locally for display purposes only
    if (!session?.user) {
      const isCorrect = selectedOption === currentQuestion.correctAnswer;
      if (isCorrect) {
        setScore(score + 1);
      }
    } else {
      // For logged-in users, get score from backend
      try {
        if (!activeQuizId) {
          setError("Quiz not initialized.");
          return;
        }

        const response = await fetch("/api/quiz-attempts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizId: activeQuizId,
            questionId: currentQuestion.id,
            selectedOption,
          }),
        });

        if (response.ok) {
          const attemptData = await response.json();
          // Update score from backend response
          setScore(attemptData.score);
        } else if (response.status === 403) {
          // Handle attempt limit error
          const errorData = await response.json();
          setError(
            errorData.error || "Maximum attempts reached for this quiz."
          );
          return; // Stop the quiz progression
        } else if (response.status === 404) {
          // Handle no quiz available error
          const errorData = await response.json();
          setError(errorData.error || "No quiz available for this major.");
          return; // Stop the quiz progression
        } else {
          // Handle other errors
          const errorData = await response.json();
          setError(
            errorData.error || "An error occurred while saving your answer."
          );
          return;
        }
      } catch (error) {
        console.error("Failed to save answer:", error);
        setError("Failed to save your answer. Please try again.");
        return;
      }
    }

    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
      if (session?.user) {
        try {
          if (!activeQuizId) {
            return;
          }
          const response = await fetch("/api/quiz-attempts/complete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              totalQuestions: shuffledQuestions.length,
              quizId: activeQuizId,
            }),
          });

          if (response.ok) {
            const finalAttemptData = await response.json();
            // Update final score from backend response
            setScore(finalAttemptData.score);
          }
        } catch (error) {
          console.error("Failed to save final score:", error);
        }
      }
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResults(false);
    setError(null);
    setShuffledQuestions(
      [...shuffledQuestions].sort(() => Math.random() - 0.5)
    );
  };

  const handleFilterChange = (key: keyof QuizFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));

    // Fetch attempt stats when major changes
    if (key === "major" && value && session?.user) {
      fetchAttemptStats(value);
    }
  };

  const fetchAttemptStats = async (major: string) => {
    if (!session?.user) return;

    try {
      const response = await fetch("/api/quiz-attempts");
      if (response.ok) {
        const data = await response.json();
        const majorStats = data.attemptStats?.find(
          (stat: any) => stat.major === major
        );
        if (majorStats) {
          setRemainingAttempts(majorStats.remainingAttempts);
        } else {
          setRemainingAttempts(2); // Default to 2 attempts if no stats found
        }
      }
    } catch (error) {
      console.error("Failed to fetch attempt stats:", error);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-900">Loading questions...</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-xl text-red-600 mb-4">{error}</div>
          {error.includes("No quiz available") && (
            <div className="text-sm text-gray-600 mb-4">
              This usually happens when:
              <ul className="list-disc list-inside mt-2 text-left">
                <li>No teacher has created questions for this major yet</li>
                <li>The quiz system is being set up for this major</li>
                <li>There's a temporary issue with the quiz availability</li>
              </ul>
            </div>
          )}
          <button
            onClick={() => {
              setError(null);
              setCurrentQuestionIndex(0);
              setScore(0);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );

  if (!shuffledQuestions.length)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-900">No questions available</div>
      </div>
    );

  if (showResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">
            Quiz Results
          </h2>
          <div className="text-center">
            <p className="text-xl mb-4 text-gray-900">
              Your score: {score} out of {shuffledQuestions.length}
            </p>
            <p className="text-lg mb-6 text-gray-800">
              Percentage:{" "}
              {((score / shuffledQuestions.length) * 100).toFixed(1)}%
            </p>
            {!session?.user && (
              <p className="text-sm text-gray-600 mb-4">
                Sign in to save your results and track your progress!
              </p>
            )}
            <button
              onClick={restartQuiz}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {/* Filters Section */}
        <div className="mb-6">
          <select
            className="w-full p-2 border rounded"
            value={filters.major || ""}
            onChange={(e) => handleFilterChange("major", e.target.value)}
          >
            <option value="">Select Major</option>
            {availableMajors.map((major) => (
              <option key={major} value={major}>
                {major}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 text-sm text-gray-700">
          Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
        </div>
        <div className="mb-2 text-sm text-gray-600">
          {currentQuestion.major}
        </div>
        {session?.user && remainingAttempts !== null && (
          <div className="mb-4 text-sm text-blue-600">
            Remaining attempts: {remainingAttempts}
          </div>
        )}
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          {currentQuestion.question}
        </h2>
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-500 transition-colors text-gray-800"
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-6 text-center text-gray-800">
          Score: {score}
          {!session?.user && (
            <p className="text-sm text-gray-600 mt-2">
              Sign in to save your progress!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
