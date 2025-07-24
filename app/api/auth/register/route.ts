import { NextResponse, NextRequest } from "next/server";
import { hash } from "bcryptjs";
import dbConnect from "@/lib/db";
// Removed imports for Student and Teacher as they are not created here initially
// import Student from "@/models/Student";
// import Teacher from "@/models/Teacher";
import PendingUser from "@/models/PendingUser"; // Import the new PendingUser model
import { withRateLimit, registrationLimiter } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  return withRateLimit(request, registrationLimiter, async (req) => {
    try {
      const body = await request.json();
      const { name, email, password } = body; // Remove role from destructuring

      // Validate input (only name, email, password needed for pending user)
      if (!name || !email || !password) {
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }

      await dbConnect();

      // Check if user already exists in PendingUser collection
      const existingUser = await PendingUser.findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          { message: "User with this email is already pending approval" },
          { status: 400 }
        );
      }

      // Also check if user already exists in Student or Teacher collections
      // (This prevents a user from registering again if they were already approved or manually added)
      const existingApprovedUser =
        (await (await import("@/models/Student")).default.findOne({ email })) ||
        (await (await import("@/models/Teacher")).default.findOne({ email }));
      if (existingApprovedUser) {
        return NextResponse.json(
          { message: "User with this email already exists" },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await hash(password, 12);

      // Create pending user
      const pendingUser = await PendingUser.create({
        name,
        email,
        password: hashedPassword,
      });



      return NextResponse.json(
        {
          message: "Registration successful. Your account is pending approval.",
          // Optionally return some limited pending user info
          user: { name: pendingUser.name, email: pendingUser.email },
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Registration error:", error);
      return NextResponse.json(
        { message: "Error during registration" },
        { status: 500 }
      );
    }
  });
}
