import mongoose from "mongoose";

export interface IStudent extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  role: "student";
  createdAt: Date;
  attempts: mongoose.Types.ObjectId[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

const StudentSchema = new mongoose.Schema({
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
    enum: ["student"],
    default: "student",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  attempts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
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
});

const Student =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);

export default Student;
