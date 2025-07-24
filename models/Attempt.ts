import mongoose from "mongoose";

export interface IAttempt extends mongoose.Document {
  quiz: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  score: number;
  totalQuestions: number;
  major: string;
  answers: number[];
  startedAt: Date;
  endedAt: Date;
}

const AttemptSchema = new mongoose.Schema({ //Quiz ve Student ID'leri Attempt belgesi içinde saklanır 
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  major: {
    type: String,
    required: true,
  },
  answers: {
    type: [Number],
    required: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
  },
});

export default mongoose.models.Attempt ||
  mongoose.model<IAttempt>("Attempt", AttemptSchema);
