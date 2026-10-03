import mongoose from "mongoose";

export interface IUser {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

export const UserData = mongoose.models.UserData || mongoose.model<IUser>('UserData', userSchema);
export default UserData;
