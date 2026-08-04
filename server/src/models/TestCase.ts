import mongoose, { Schema, Document } from 'mongoose';

export interface ITestCase extends Document {
  problemId: mongoose.Types.ObjectId;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  order: number;
}

const testCaseSchema = new Schema<ITestCase>(
  {
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
    input: {
      type: String,
      required: true,
    },
    expectedOutput: {
      type: String,
      required: true,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

testCaseSchema.index({ problemId: 1, order: 1 });

export const TestCase = mongoose.model<ITestCase>('TestCase', testCaseSchema);
