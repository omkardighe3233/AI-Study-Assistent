import mongoose from 'mongoose';

const pdfSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    cloudinaryUrl: {
      type: String,
      required: [true, 'Please provide cloudinary URL'],
    },
    summary: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Pdf = mongoose.model('Pdf', pdfSchema);
export default Pdf;
