import mongoose, { Document, Schema } from 'mongoose';

interface ISticker extends Document {
  publicId: string;
}

const stickerSchema = new Schema<ISticker>({
  publicId: { type: String, required: true },
});

const Sticker = mongoose.model<ISticker>('Sticker', stickerSchema, 'Stickers');

export default Sticker;
