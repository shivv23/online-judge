import mongoose, { Schema, Document } from 'mongoose';

export type SubmissionVerdict =
  | 'Pending'
  | 'Compile Error'
  | 'Runtime Error'
  | 'Time Limit Exceeded'
  | 'Wrong Answer'
  | 'Accepted';

export type SubmissionLanguage = 'cpp' | 'c' | 'python' | 'js' | 'java';

export interface ISubmission extends Document {
  userId: mongoose.Types.ObjectId;
  problemId: mongoose.Types.ObjectId;
  code: string;
  language: SubmissionLanguage;
  verdict: SubmissionVerdict;
  executionTimeMs: number;
  memoryUsedKB: number;
  testCasesPassed: number;
  totalTestCases: number;
  errorMessage: string;
}

const submissionSchema = new Schema<ISubmission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problemId: {
      type: Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: ['cpp', 'c', 'python', 'js', 'java'],
      required: true,
    },
    verdict: {
      type: String,
      enum: [
        'Pending',
        'Compile Error',
        'Runtime Error',
        'Time Limit Exceeded',
        'Wrong Answer',
        'Accepted',
      ],
      default: 'Pending',
    },
    executionTimeMs: {
      type: Number,
      default: 0,
    },
    memoryUsedKB: {
      type: Number,
      default: 0,
    },
    testCasesPassed: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ problemId: 1, createdAt: -1 });

export const Submission = mongoose.model<ISubmission>('Submission', submissionSchema);
