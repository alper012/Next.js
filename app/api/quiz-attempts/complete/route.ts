import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Attempt from "@/models/Attempt";
import Student from "@/models/Student";
import dbConnect from "@/lib/db";

export async function POST(req: Request) {
  try {
    await dbConnect();

    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { totalQuestions, major } = body;

    if (!totalQuestions || !major) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const student = await Student.findOne({ email: session.user.email });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Find the active attempt for this student and major
    const attempt = await Attempt.findOne({
      student: student._id,
      major,
      endedAt: { $exists: false },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "No active attempt found" },
        { status: 404 }
      );
    }

    // The score is already calculated in quiz-attempts-route (isCorrect variable)
    // Just update the attempt with final details and end time
    attempt.totalQuestions = totalQuestions;
    attempt.endedAt = new Date();
    await attempt.save();

    return NextResponse.json(attempt);
  } catch (error) {
    console.error("Error completing attempt:", error);
    return NextResponse.json(
      { error: "Error completing attempt" },
      { status: 500 }
    );
  }
}
