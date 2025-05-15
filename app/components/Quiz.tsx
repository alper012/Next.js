"use client";

import { useState, useEffect } from "react";
import { Question } from "../types/quiz";
import { questions } from "../data/questions";

export default function Quiz() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  useEffect(() => {
    // Shuffle questions when component mounts
    setShuffledQuestions([...questions].sort(() => Math.random() - 0.5));
  }, []);

  const handleAnswer = (selectedOption: number) => {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }

    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResults(false);
    setShuffledQuestions([...questions].sort(() => Math.random() - 0.5));
  };

  if (!shuffledQuestions.length) return <div>Loading...</div>;

  if (showResults) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6">Quiz Results</h2>
          <div className="text-center">
            <p className="text-xl mb-4">
              Your score: {score} out of {shuffledQuestions.length}
            </p>
            <p className="text-lg mb-6">
              Percentage:{" "}
              {((score / shuffledQuestions.length) * 100).toFixed(1)}%
            </p>
            <button
              onClick={restartQuiz}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
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
        <div className="mb-4 text-sm text-gray-500">
          Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
        </div>
        <h2 className="text-xl font-semibold mb-6">
          {currentQuestion.question}
        </h2>
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-500 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-6 text-center text-gray-600">Score: {score}</div>
      </div>
    </div>
  );
}
