import mongoose from "mongoose";

export interface IQuestion extends mongoose.Document {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  major: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  question: {
    type: String,
    required: [true, "Please provide a question"],
  },
  options: {
    type: [String],
    required: [true, "Please provide options"],
    validate: [
      (val: string[]) => val.length >= 2,
      "At least two options are required",
    ],
  },
  correctAnswer: {
    type: Number,
    required: [true, "Please provide the correct answer index"],
  },
  major: {
    type: String,
    required: [true, "Please provide a major"],
  },
  createdBy: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
QuestionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Question =
  mongoose.models.Question ||
  mongoose.model<IQuestion>("Question", QuestionSchema);

export default Question;
