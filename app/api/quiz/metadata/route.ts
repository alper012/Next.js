import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Quiz from "@/models/Quiz";

export async function GET() {
  await dbConnect();
  // Extract unique majors from the Quiz model
  const majors = await Quiz.distinct("major");
  const metadata = { majors };
  return NextResponse.json(metadata);
}
