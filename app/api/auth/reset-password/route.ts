import { NextResponse, NextRequest } from "next/server";
import { hash } from "bcryptjs";
import dbConnect from "@/lib/db";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import { withRateLimit, authLimiter } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  return withRateLimit(request, authLimiter, async (req) => {
    const { token, role, password } = await request.json();
    if (!token || !role || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    if (password.length < 5) {
      return NextResponse.json(
        { message: "Password must be at least 5 characters." },
        { status: 400 }
      );
    }
    await dbConnect();
    let user = null;
    if (role === "teacher") {
      user = await Teacher.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      });
    } else if (role === "student") {
      user = await Student.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      });
    }
    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }
    user.password = await hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return NextResponse.json({
      message: "Password has been reset successfully.",
    });
  });
}
