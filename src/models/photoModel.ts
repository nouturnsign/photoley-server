import mongoose, { Types, Schema, Document } from 'mongoose';

interface IPhoto extends Document {
  url: string;
  pictureTaker: Types.ObjectId;
  taggedUsers: Types.ObjectId[];
  isTagComplete: boolean;
  location: {
    type: string;
    coordinates: [number, number];
  };
  createdAt: Date;
}

const photoSchema = new Schema<IPhoto>({
  url: { type: String, required: true },
  pictureTaker: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  taggedUsers: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  location: {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true },
  },
  createdAt: { type: Date, required: true, default: Date.now, index: true },
});

photoSchema.set('toJSON', {
  transform: (doc, ret) => {
    let docTyped = doc as IPhoto;
    if (docTyped.populated('pictureTaker')) {
      ret.pictureTaker = docTyped.pictureTaker;
    }
    if (docTyped.populated('taggedUsers')) {
      ret.taggedUsers = docTyped.taggedUsers;
    }
    return {
      id: ret._id,
      url: ret.url,
      pictureTaker: ret.pictureTaker,
      taggedUsers: ret.taggedUsers,
      isTagComplete: ret.isTagComplete,
      location: ret.location,
      createdAt: ret.createdAt,
    };
  },
});

// Create a geospatial index on the location field
photoSchema.index({ location: '2dsphere' });

const Photo = mongoose.model<IPhoto>('Photo', photoSchema, 'Photos');

export default Photo;
export { IPhoto };
