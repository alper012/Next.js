import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import Attempt from "@/models/Attempt";
import Student from "@/models/Student";
import Quiz from "@/models/Quiz";
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
      const { quizId, questionId, selectedOption } = body as {
        quizId?: string;
        questionId?: number;
        selectedOption?: number;
      };

      if (!quizId || questionId === undefined || selectedOption === undefined) {
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

      // Load the quiz and validate the requested question
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
      }

      // Find the embedded question by its sequential id
      const embeddedQuestion = quiz.questions.find(
        (q: any) => q.id === questionId
      );
      if (!embeddedQuestion) {
        return NextResponse.json(
          { error: "Question not found in quiz" },
          { status: 404 }
        );
      }

      // Calculate if the answer is correct using embedded question
      const isCorrect = selectedOption === embeddedQuestion.correctAnswer;

      // Check if student already has an active attempt for this major
      let attempt = await Attempt.findOne({
        student: student._id,
        quiz: quiz._id,
        endedAt: { $exists: false },
      });

      if (!attempt) {
        // Check if student has already reached the maximum of 2 attempts for this major
        const completedAttempts = await Attempt.countDocuments({
          student: student._id,
          major: quiz.major,
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
          major: quiz.major,
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
