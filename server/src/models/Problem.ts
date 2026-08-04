import mongoose, { Schema, Document } from 'mongoose';

export interface IProblem extends Document {
  title: string;
  slug: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sampleInput: string;
  sampleOutput: string;
  timeLimit: number;
  memoryLimit: number;
  createdBy: mongoose.Types.ObjectId;
  totalSubmissions: number;
  acceptedSubmissions: number;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const problemSchema = new Schema<IProblem>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    statement: {
      type: String,
      required: true,
    },
    inputFormat: {
      type: String,
      required: true,
    },
    outputFormat: {
      type: String,
      required: true,
    },
    constraints: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
    },
    sampleInput: {
      type: String,
      required: true,
    },
    sampleOutput: {
      type: String,
      required: true,
    },
    timeLimit: {
      type: Number,
      default: 2000,
      min: 100,
      max: 10000,
    },
    memoryLimit: {
      type: Number,
      default: 256,
      min: 16,
      max: 1024,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    totalSubmissions: {
      type: Number,
      default: 0,
    },
    acceptedSubmissions: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

problemSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }
  next();
});

problemSchema.index({ difficulty: 1, createdAt: -1 });
problemSchema.index({ tags: 1 });

export const Problem = mongoose.model<IProblem>('Problem', problemSchema);
