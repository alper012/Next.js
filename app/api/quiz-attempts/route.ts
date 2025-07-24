import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import Attempt from "@/models/Attempt";
import Student from "@/models/Student";
import Quiz from "@/models/Quiz";
import Question from "@/models/Question";
import dbConnect from "@/lib/db";
import { withRateLimit, apiLimiter } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  return withRateLimit(req, apiLimiter, async (request) => {
    try {
      await dbConnect();

      const session = await getServerSession(); //istekle birlikte gelen cookie'yi alip cozer ve bir session objesi olusturur (authentication)

      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const body = await req.json();
      const { questionId, selectedOption, major } = body;

      if (!questionId || selectedOption === undefined || !major) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const student = await Student.findOne({ email: session.user.email });
      if (!student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }

      // Fetch the question to get the correct answer
      const question = await Question.findOne({ id: questionId });
      if (!question) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      // Calculate if the answer is correct on the backend
      const isCorrect = selectedOption === question.correctAnswer;

      // Find a quiz for this major (required for attempt tracking)
      const quiz = await Quiz.findOne({ major }).sort({ createdAt: -1 });
      if (!quiz) {
        return NextResponse.json(
          {
            error: `No quiz available for ${major} major. Please contact your teacher.`,
          },
          { status: 404 }
        );
      }

      // Check if student already has an active attempt for this major
      let attempt = await Attempt.findOne({
        student: student._id, //Belirli bir öğrenciye ait olmalı
        major, //Belirli bir ana dal (major) ile ilişkili olmalı
        endedAt: { $exists: false }, // 3. Henüz sona ermemiş (aktif) olmalı
      });

      if (!attempt) {
        // Check if student has already reached the maximum of 2 attempts for this major
        const completedAttempts = await Attempt.countDocuments({
          student: student._id,
          major,
          endedAt: { $exists: true },
        });

        if (completedAttempts >= 2) {
          return NextResponse.json(
            {
              error:
                "Maximum attempts reached. You can only attempt this quiz 2 times.",
            },
            { status: 403 }
          );
        }

        // Create new attempt
        attempt = await Attempt.create({
          quiz: quiz._id,
          student: student._id,
          score: 0,
          totalQuestions: 0,
          major,
          answers: [],
          startedAt: new Date(),
        });

        // Add the attempt to student's attempts array
        student.attempts.push(attempt._id);
        await student.save();
      }

      // Add the answer to the attempt
      attempt.answers.push(selectedOption);
      if (isCorrect) {
        attempt.score += 1;
      }
      attempt.totalQuestions += 1;
      await attempt.save();

      return NextResponse.json(attempt);
    } catch (error) {
      console.error("Error creating attempt:", error);
      return NextResponse.json(
        { error: "Error creating attempt" },
        { status: 500 }
      );
    }
  });
}

export async function GET(req: NextRequest) {
  return withRateLimit(req, apiLimiter, async (request) => {
    try {
      await dbConnect();

      const session = await getServerSession();

      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const student = await Student.findOne({ email: session.user.email });
      if (!student) {
        return NextResponse.json(
          { error: "Student not found" },
          { status: 404 }
        );
      }

      const attempts = await Attempt.find({ student: student._id })
        .populate("quiz", "title description")
        .sort({ startedAt: -1 });

      // Get attempt statistics for each major
      const attemptStats = await Attempt.aggregate([
        { $match: { student: student._id } },
        {
          $group: {
            _id: "$major",
            totalAttempts: { $sum: 1 },
            completedAttempts: {
              $sum: { $cond: [{ $exists: ["$endedAt", true] }, 1, 0] },
            },
            activeAttempts: {
              $sum: { $cond: [{ $exists: ["$endedAt", false] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            major: "$_id",
            totalAttempts: 1,
            completedAttempts: 1,
            activeAttempts: 1,
            remainingAttempts: { $subtract: [2, "$completedAttempts"] },
          },
        },
      ]);

      return NextResponse.json({
        attempts,
        attemptStats,
      });
    } catch (error) {
      console.error("Error fetching attempts:", error);
      return NextResponse.json(
        { error: "Error fetching attempts" },
        { status: 500 }
      );
    }
  });
}
