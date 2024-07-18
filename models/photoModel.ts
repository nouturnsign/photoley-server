import mongoose, { Schema, Document } from 'mongoose';

export interface IPhoto extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  photoUrl: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

const photoSchema = new Schema<IPhoto>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  photoUrl: { type: String, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  }
});

const Photo = mongoose.model<IPhoto>('Photo', photoSchema);

export default Photo;
