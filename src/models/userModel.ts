import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const salt = 10;

interface IUser extends Document {
  email: string;
  password: string;
  username: string;
  profilePicture: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    profilePicture: { type: String },
  },
  {
    timestamps: true,
  }
);

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    return {
      user: {
        id: ret._id,
        email: ret.email,
        username: ret.username,
        profilePicture: ret.profilePicture,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
      },
    };
  },
});

// Hash the password before saving the user
userSchema.pre('save', async function (this: IUser, next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const User = mongoose.model<IUser>('User', userSchema, 'Users');

export default User;
export { IUser };
