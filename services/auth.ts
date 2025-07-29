import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import Teacher from "@/models/Teacher";
import Student from "@/models/Student";

export async function authenticateUser(email: string, password: string) {
  await dbConnect();

  // Try to find user in Teacher model first
  let user = await Teacher.findOne({ email });

  // If not found in Teacher model, try Student model
  if (!user) {
    user = await Student.findOne({ email });
  }

  if (!user || !user?.password) {
    throw new Error("No user found with this email");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
