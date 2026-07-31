import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    content: {
      type: String,
      required: [true, 'Please add content'],
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    highlights: [
      {
        text: String,
        color: String,
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Note = mongoose.model('Note', noteSchema);
export default Note;
