import mongoose from "mongoose";

export interface ICounter extends mongoose.Document {
  _id: string;
  seq: number;
}

const CounterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

const Counter =
  mongoose.models.Counter || mongoose.model<ICounter>("Counter", CounterSchema);

export default Counter;
