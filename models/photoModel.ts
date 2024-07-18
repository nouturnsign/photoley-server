import mongoose, { Schema, Document } from 'mongoose';

export interface IPhoto extends Document {
  photoUrl: string;
  location: { lat: number; lon: number };
  userId: mongoose.Schema.Types.ObjectId;
}

const photoSchema = new Schema<IPhoto>({
  photoUrl: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true }
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

const Photo = mongoose.model<IPhoto>('Photo', photoSchema, 'Photos');

export default Photo;
