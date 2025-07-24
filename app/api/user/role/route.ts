import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Teacher from "@/models/Teacher";
import Student from "@/models/Student";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await dbConnect();
  // Fetch user from DB
  let user = null;
  if (session.user.role === "teacher") {
    user = await Teacher.findOne({ email: session.user.email });
  } else {
    user = await Student.findOne({ email: session.user.email });
  }

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  const userRole = {
    id: user._id.toString(),
    role: user.role,
    ...(user.role === "teacher" ? { major: user.major } : {}),
  };

  return NextResponse.json(userRole);
}
