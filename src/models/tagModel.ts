import mongoose, { Document, Schema } from 'mongoose';
import { Types } from 'mongoose';

interface ILocation {
  lat: number;
  lon: number;
}

interface ITag extends Document {
  creatorId: Types.ObjectId;
  taggedUserId: Types.ObjectId;
  isCompleted: boolean;
  location: {
    type: string;
    coordinates: [number, number];
  };
  createdAt: Date;
}

const tagSchema = new Schema<ITag>({
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  taggedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isCompleted: { type: Boolean, default: false },
  location: {
    type: { type: String, required: true },
    coordinates: { type: [Number], required: true },
  },
  createdAt: { type: Date, required: true, default: Date.now },
});

// Create a geospatial index on the location field
tagSchema.index({ location: '2dsphere' });

const Tag = mongoose.model<ITag>('Tag', tagSchema, 'Tags');

export default Tag;
export { ILocation };
