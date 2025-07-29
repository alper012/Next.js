import { NextResponse, NextRequest } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/db";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import { withRateLimit, authLimiter } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  return withRateLimit(request, authLimiter, async (req) => {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }
  await dbConnect();
  // Try to find user in Teacher first, then Student
  let user = await Teacher.findOne({ email });
  let userRole = "teacher";
  if (!user) {
    user = await Student.findOne({ email });
    userRole = "student";
  }
  if (!user) {
    // Don't reveal if user exists
    return NextResponse.json({
      message: "If that email exists, a reset link will be sent.",
    });
  }
  // Generate token and expiry
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  user.passwordResetToken = token;
  user.passwordResetExpires = expiry;
  await user.save();

  console.log(
    `Password reset link: ${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/auth/reset-password?token=${token}&role=${userRole}`
  );
  return NextResponse.json({
    message: "If that email exists, a reset link will be sent.",
  });
  });
}
