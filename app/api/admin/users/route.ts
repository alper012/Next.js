// API route for admin to manage users (approve, create/update)

import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import PendingUser from "@/models/PendingUser";
import Student from "@/models/Student";
import Teacher from "@/models/Teacher";
import { withRateLimit, adminLimiter } from "@/lib/rateLimit";

// POST to approve a pending user or update an existing user's role/major
export async function POST(req: NextRequest) {
  return withRateLimit(req, adminLimiter, async (request) => {
  try {
    const session = await getServerSession(authOptions); //istekle birlikte gelen cookie'yi alip cozer ve bir session objesi olusturur (authentication)

    // Protect the route: Only allow admins to access this
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    // destructing fields from the response
    const { id, targetRole } = body;

    if (!id || !targetRole) {
      return NextResponse.json(
        { error: "Missing id or targetRole" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Try to find the user in Pending, Student, or Teacher collections
    let user = await PendingUser.findById(id);

    if (!user) {
      user = await Student.findById(id);
    }
    if (!user) {
      user = await Teacher.findById(id);
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not found in any collection" },
        { status: 404 }
      );
    }

    // Determine collection type from user object
    const isPendingUser = !user.role; // PendingUser doesn't have a role field
    const currentCollection = isPendingUser
      ? "PendingUser"
      : user.role === "admin"
      ? "Teacher"
      : user.role;

    // --- Handle updating existing users (Student or Teacher) ---
    if (!isPendingUser) {
      if (user.role === targetRole) {
        // If role is the same, no update needed
        return NextResponse.json({
          message: `${targetRole} ${user.email} role is already ${targetRole}`,
        });
      } else {
        // Role is changing
        // Delete from current collection
        if (currentCollection === "student") {
          await Student.findByIdAndDelete(id);
        } else if (
          currentCollection === "teacher" ||
          currentCollection === "Teacher"
        ) {
          await Teacher.findByIdAndDelete(id);
        }

        // Create in new collection with new role
        if (targetRole === "student") {
          const newStudent = await Student.create({
            name: user.name,
            email: user.email,
            password: user.password,
            role: "student",
          });
          // Update the user object to reflect the new state
          user = newStudent;
        } else if (targetRole === "teacher") {
          // Create a new teacher
          const newTeacher = await Teacher.create({
            name: user.name,
            email: user.email,
            password: user.password,
            role: "teacher",
          });
          // Update the user object to reflect the new state
          user = newTeacher;
        } else if (targetRole === "admin") {
          // Admins stay in their original collection but role is updated
          if (currentCollection === "student") {
            await Student.findByIdAndUpdate(id, { role: "admin" });
          } else if (
            currentCollection === "teacher" ||
            currentCollection === "Teacher"
          ) {
            await Teacher.findByIdAndUpdate(id, { role: "admin" });
          }
          // Need to refetch user to get updated role
          user = (await Student.findById(id)) || (await Teacher.findById(id));
        }
        const { password: _, ...userWithoutPassword } = user.toObject();
        return NextResponse.json({
          message: `User ${user.name} role changed to ${targetRole}`,
          user: userWithoutPassword,
        });
      }
    } else {
      // --- Handle approving pending users ---
      // This is the existing approval logic
      let newUser;
      if (targetRole === "student") {
        // Create a new student
        newUser = await Student.create({
          name: user.name,
          email: user.email,
          password: user.password,
          role: "student",
        });
      } else if (targetRole === "teacher") {
        // Create a new teacher
        newUser = await Teacher.create({
          name: user.name,
          email: user.email,
          password: user.password,
          role: "teacher",
        });
      } else if (targetRole === "admin") {
        // Create admin as Teacher
        newUser = await Teacher.create({
          name: user.name,
          email: user.email,
          password: user.password,
          role: "admin",
        });
      } else {
        return NextResponse.json(
          { error: "Invalid role specified" },
          { status: 400 }
        );
      }

      // Delete the pending user
      await PendingUser.findByIdAndDelete(id);

      // Optionally, return details of the newly created user (excluding password)
      const { password: _, ...newUserWithoutPassword } = newUser.toObject();

      return NextResponse.json({
        message: "User approved and created successfully",
        user: newUserWithoutPassword,
      });
    }
  } catch (error) {
    console.error("Error managing user:", error);
    return NextResponse.json({ error: "Error managing user" }, { status: 500 });
  }
  });
}

// DELETE to delete a user (pending, student, or teacher)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Protect the route: Only allow admins to access this
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id"); // Get the user ID from query params

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    await dbConnect();

    const deleteFromPending = await PendingUser.findByIdAndDelete(id);
    if (deleteFromPending) {
      return NextResponse.json({
        message: "Pending user deleted successfully",
      });
    }

    const deleteFromStudent = await Student.findByIdAndDelete(id);
    if (deleteFromStudent) {
      return NextResponse.json({ message: "Student deleted successfully" });
    }

    const deleteFromTeacher = await Teacher.findByIdAndDelete(id);
    if (deleteFromTeacher) {
      return NextResponse.json({ message: "Teacher deleted successfully" });
    }

    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Error deleting user" }, { status: 500 });
  }
}

// PUT to update an existing user's name
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Protect the route: Only allow admins to access this
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, major } = body;
    console.log("PUT /api/admin/users body:", body);
    if (!id || (typeof name === "undefined" && typeof major === "undefined")) {
      return NextResponse.json(
        { error: "Missing id or update field" },
        { status: 400 }
      );
    }

    await dbConnect();

    let updateFields = {};
    if (typeof name !== "undefined") updateFields.name = name;
    if (typeof major !== "undefined") updateFields.major = major;

    let updatedUser = await Student.findByIdAndUpdate(id, updateFields, {
      new: true,
    });
    if (!updatedUser) {
      updatedUser = await Teacher.findByIdAndUpdate(id, updateFields, {
        new: true,
      });
    }
    console.log("PUT /api/admin/users updatedUser:", updatedUser);
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove password from the response
    const { password: _, ...userWithoutPassword } = updatedUser.toObject();

    return NextResponse.json({
      message: name
        ? `User name updated to ${updatedUser.name}`
        : `User major updated to ${updatedUser.major}`,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error updating user name:", error);
    return NextResponse.json(
      { error: "Error updating user name" },
      { status: 500 }
    );
  }
}
