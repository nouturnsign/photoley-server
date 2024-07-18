import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  profilePicture: string;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  profilePicture: { type: String, default: '' }
});

const User = mongoose.model<IUser>('User', userSchema);

export default User;
