import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Quiz from "@/models/Quiz";
import Teacher from "@/models/Teacher";
import Question from "@/models/Question";
import Counter from "@/models/Counter";

export async function GET(request: NextRequest) {
  await dbConnect();
  const major = request.nextUrl.searchParams.get("major");

  // Fetch questions from the database, optionally filtering by major
  const filter = major ? { major } : {};
  const questions = await Question.find(filter);

  return NextResponse.json(questions);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is a teacher
    if (session.user.role !== "teacher") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { question, options, correctAnswer, major, title, description } =
      body;

    // Validate required fields
    if (!question || !options || correctAnswer === undefined || !major) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: question, options, correctAnswer, major",
        },
        { status: 400 }
      );
    }

    // Validate options array
    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: "At least two options are required" },
        { status: 400 }
      );
    }

    // Validate correctAnswer index
    if (correctAnswer < 0 || correctAnswer >= options.length) {
      return NextResponse.json(
        { error: "Correct answer index is out of range" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find the teacher
    const teacher = await Teacher.findOne({ email: session.user.email });
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Generate a unique sequential ID using MongoDB's findAndModify
    const counter = await Counter.findByIdAndUpdate(
      "questionId",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const questionId = counter.seq;

    // Create the question using the Question model for validation
    const newQuestion = new Question({
      id: questionId,
      question,
      options,
      correctAnswer,
      major,
      createdBy: session.user.id,
    });

    // Validate the question
    await newQuestion.validate();

    // Convert to plain object for embedding in quiz
    const questionData = newQuestion.toObject();

    // Find an existing quiz with less than 5 questions for this teacher and major
    let quiz = await Quiz.findOne({
      teacher: teacher._id,
      major: major,
      $expr: { $lt: [{ $size: "$questions" }, 5] },
    });

    if (quiz) {
      // Add question to existing quiz
      quiz.questions.push(questionData);
      await quiz.save();
    } else {
      // Create a new quiz with this question
      quiz = await Quiz.create({
        title: title || `Quiz - ${question.substring(0, 50)}...`,
        description: description || `Quiz containing: ${question}`,
        questions: [questionData],
        major,
        teacher: teacher._id,
      });

      // Add the quiz to teacher's quizzes array
      teacher.quizzes.push(quiz._id);
      await teacher.save();
    }

    return NextResponse.json({
      message: "Question created successfully",
      quiz: quiz,
      question: questionData,
    });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
