import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'user' | 'admin';
  avatar?: string;
  solvedProblems: mongoose.Types.ObjectId[];
  comparePassword(candidate: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> {
  isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
  isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
    solvedProblems: {
      type: [Schema.Types.ObjectId],
      ref: 'Problem',
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.statics.isEmailTaken = async function (
  email: string,
  excludeUserId?: string,
): Promise<boolean> {
  const query = this.findOne({ email });
  if (excludeUserId) {
    query.where('_id').ne(excludeUserId);
  }
  const user = await query.select('_id');
  return !!user;
};

userSchema.statics.isUsernameTaken = async function (
  username: string,
  excludeUserId?: string,
): Promise<boolean> {
  const query = this.findOne({ username });
  if (excludeUserId) {
    query.where('_id').ne(excludeUserId);
  }
  const user = await query.select('_id');
  return !!user;
};

export const User: IUserModel = mongoose.model<IUser, IUserModel>('User', userSchema);
