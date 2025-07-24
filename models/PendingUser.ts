import mongoose from "mongoose";

export interface IPendingUser extends mongoose.Document {
  name: string;
  email: string;
  password?: string; // Password can be optional after initial setup if using other providers
  createdAt: Date;
}

const PendingUserSchema = new mongoose.Schema({
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
    required: false, // Allow null for users who might sign up via other methods later
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PendingUser =
  mongoose.models.PendingUser ||
  mongoose.model<IPendingUser>("PendingUser", PendingUserSchema);

export default PendingUser;
