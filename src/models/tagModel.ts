import mongoose, { Document, Schema } from 'mongoose';
import { Types } from 'mongoose';

interface ITag extends Document {
  creatorId: Types.ObjectId;
  taggedUserId: Types.ObjectId;
  createdAt: Date;
  isCompleted: boolean;
}

const tagSchema = new Schema<ITag>({
  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  taggedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  isCompleted: { type: Boolean, default: false },
});

const Tag = mongoose.model<ITag>('Tag', tagSchema, 'Tags');
export default Tag;
