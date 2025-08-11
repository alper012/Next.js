"use client";

import { Suspense } from "react";
import LoginForm from "@/app/components/LoginForm";
import { useSearchParams } from "next/navigation";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const pendingApproval = searchParams.get("pendingApproval");

  return (
    <div>
      {pendingApproval && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0"></div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your account is pending admin approval. You will be notified
                once it's approved.
              </p>
            </div>
          </div>
        </div>
      )}
      <LoginForm />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginPageContent />
    </Suspense>
  );
}
