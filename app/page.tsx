"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log("Home page - Status:", status);
    console.log("Home page - Session:", session);

    if (status === "authenticated") {
      console.log("User role:", session?.user?.role);
      if (session?.user?.role === "admin") {
        console.log("Redirecting admin to /admin");
        router.push("/admin");
      } else {
        console.log("Redirecting user to /quiz");
        router.push("/quiz");
      }
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to QuizMaster
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your ultimate platform for interactive learning across various
            subjects. Test your knowledge, track your progress, and excel in
            your studies.
          </p>
        </div>

        {session && (
          <div className="mb-8 p-4 bg-yellow-100 border border-yellow-400 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Debug Info:</strong> You are logged in as{" "}
              {session.user?.email} with role {session.user?.role}
            </p>
            <button
              onClick={() => signOut()}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Sign Out (Debug)
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Features Section */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Why Choose QuizMaster?
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-600">
                  Multiple subjects and topics to choose from
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-600">
                  Track your progress and performance
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-600">
                  Different difficulty levels for all users
                </span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-600">
                  Perfect for both students and teachers
                </span>
              </li>
            </ul>
          </div>

          {/* Auth Section */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Get Started
            </h2>
            <div className="space-y-4">
              <Link
                href="/auth/login"
                className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="block w-full bg-white text-blue-600 text-center py-3 px-4 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Sign Up
              </Link>
            </div>
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:underline"
                >
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Available Subjects */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">
            Available Subjects
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {[
              "Computer Science",
              "Mathematics",
              "Physics",
              "Chemistry",
              "Biology",
              "Engineering",
            ].map((subject) => (
              <div
                key={subject}
                className="bg-white p-4 rounded-lg shadow text-center hover:shadow-md transition-shadow"
              >
                <span className="text-gray-800">{subject}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
