"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import QuizList from "../components/QuizList";
import Link from "next/link";
import { useEffect } from "react";

export default function QuizPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/login");
    }
  }, [status, session]);

  if (status === "loading") {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          {session?.user?.role !== "admin" && (
            <h1 className="text-3xl font-bold">Quizzes</h1>
          )}
          <div className="flex items-center space-x-4">
            {session?.user?.role === "teacher" ? (
              <Link
                href="/quiz/create"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Quiz
              </Link>
            ) : null}
            {session?.user?.role === "admin" ? (
              <Link
                href="/admin"
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Pending Users
              </Link>
            ) : null}
            {session?.user?.role === "admin" ? (
              <Link
                href="/admin"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                All Users
              </Link>
            ) : null}
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
        <QuizList />
      </div>
    </div>
  );
}
