// API route to fetch pending users

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import PendingUser from "@/models/PendingUser";
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

    const pendingUsers = await PendingUser.find({}).select("-password"); // Exclude passwords

    return NextResponse.json(pendingUsers);
  } catch (error) {
    console.error("Error fetching pending users:", error);
    return NextResponse.json(
      { error: "Error fetching pending users" },
      { status: 500 }
    );
  }
  });
}
