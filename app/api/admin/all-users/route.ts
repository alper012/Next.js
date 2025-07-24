// API route to fetch all registered users (students and teachers)

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import { withRateLimit, adminLimiter } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  return withRateLimit(request, adminLimiter, async (req) => {
    try {
      const session = await getServerSession(authOptions); //istekle birlikte gelen cookie'yi alip cozer ve bir session objesi olusturur (authentication)

      // Protect the route: Only allow admins to access this
      if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      await dbConnect();

      // Fetch all students and teachers
      const students = await Student.find({}).select("-password");
      const teachers = await Teacher.find({}).select("-password");

      // Combine the lists
      const allUsers = [...students, ...teachers];

      return NextResponse.json(allUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      return NextResponse.json(
        { error: "Error fetching all users" },
        { status: 500 }
      );
    }
  });
}
