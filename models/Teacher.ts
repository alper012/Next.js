import mongoose from "mongoose";

export interface ITeacher extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  role: "teacher" | "admin";
  createdAt: Date;
  quizzes: mongoose.Types.ObjectId[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  major?: string;
}

const TeacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["teacher", "admin"],
    default: "teacher",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  quizzes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
    },
  ],
  passwordResetToken: {
    type: String,
    required: false,
  },
  passwordResetExpires: {
    type: Date,
    required: false,
  },
  major: {
    type: String,
    required: false,
  },
});

const Teacher =
  mongoose.models.Teacher || mongoose.model<ITeacher>("Teacher", TeacherSchema);

export default Teacher;
