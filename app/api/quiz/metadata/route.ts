import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Question from "@/models/Question";

export async function GET() {
  await dbConnect();
  // Extract unique majors from the Question model
  const majors = await Question.distinct("major");
  const metadata = { majors };
  return NextResponse.json(metadata);
}
