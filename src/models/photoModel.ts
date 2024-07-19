import mongoose, { Schema, Document } from 'mongoose';

interface IPhoto extends Document {
  photoUrl: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  userId: mongoose.Schema.Types.ObjectId;
}

const photoSchema = new Schema<IPhoto>({
  photoUrl: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

// Create a geospatial index on the location field
photoSchema.index({ location: '2dsphere' });

const Photo = mongoose.model<IPhoto>('Photo', photoSchema);
export default Photo;
