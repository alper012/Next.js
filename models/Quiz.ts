import mongoose from "mongoose";

export interface IQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  major: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQuiz extends mongoose.Document {
  title: string;
  description: string;
  teacher: mongoose.Types.ObjectId;
  questions: IQuestion[];
  attempts: mongoose.Types.ObjectId[];
  major: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
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

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a title"],
  },
  description: {
    type: String,
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  questions: [QuestionSchema],
  major: {
    type: String,
    required: [true, "Please provide a major"],
  },
  attempts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attempt",
    },
  ],
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
QuizSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Quiz = mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);

export default Quiz;
