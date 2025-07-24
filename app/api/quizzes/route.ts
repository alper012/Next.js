import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Quiz from "@/models/Quiz";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import dbConnect from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions); //istekle birlikte gelen cookie'yi alip cozer ve bir session objesi olusturur (authentication)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prevent admin access
    if (session.user.role === "admin") {
      return NextResponse.json(
        { error: "Admins cannot access quizzes" },
        { status: 403 }
      );
    }

    await dbConnect();

    // Get user's role and majors
    const user = await (session.user.role === "student"
      ? Student.findOne({ email: session.user.email })
      : Teacher.findOne({ email: session.user.email }));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build query based on user role
    let query: any = {};

    // If user is a teacher, show their own quizzes
    if (session.user.role === "teacher") {
      query.teacher = user._id;
    }

    // For students, show all quizzes (no filtering needed)
    const quizzes = await Quiz.find(query)
      .populate("teacher", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prevent admin access
    if (session.user.role === "admin") {
      return NextResponse.json(
        { error: "Admins cannot create quizzes" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, questions, major } = body;

    if (!title || !description || !questions || !major) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const teacher = await Teacher.findOne({ email: session.user.email });
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const quiz = await Quiz.create({
      title,
      description,
      questions,
      major,
      teacher: teacher._id,
    });

    // Add the quiz to teacher's quizzes array
    teacher.quizzes.push(quiz._id);
    await teacher.save();

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json({ error: "Error creating quiz" }, { status: 500 });
  }
}
