import Pdf from '../models/Pdf.js';
import cloudinary from '../config/cloudinary.js';
import axios from 'axios';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // 1. Parse PDF text from buffer
    const pdfData = await pdfParse(req.file.buffer);
    const pdfText = pdfData.text;

    // 2. Upload to Cloudinary using a Promise
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:application/pdf;base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'study_sphere',
      resource_type: 'raw',
    });

    // 3. Generate Summary using Sarvam AI
    let summary = 'Summary not available.';
    if (process.env.SARVAM_API_KEY) {
      try {
        const prompt = `Please provide a highly structured and concise summary of the following text. 
Use clear bullet points and extract only the most important concepts and key takeaways.
Do not include conversational filler.

Text to summarize:
${pdfText.substring(0, 30000)}`;
        
        const response = await axios.post(
          'https://api.sarvam.ai/v1/chat/completions',
          {
            model: 'sarvam-105b',
            messages: [{ role: 'user', content: prompt }],
          },
          {
            headers: {
              'api-subscription-key': process.env.SARVAM_API_KEY,
              'Content-Type': 'application/json',
            },
          }
        );
        summary = response.data.choices[0].message.content;
      } catch (aiError) {
        console.error('AI Summary Error:', aiError.response?.data || aiError.message);
      }
    }

    // 4. Save to Database
    const newPdf = await Pdf.create({
      title: req.body.title || req.file.originalname,
      cloudinaryUrl: result.secure_url,
      summary,
      userId: req.user._id,
    });

    res.status(201).json(newPdf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPdfs = async (req, res) => {
  try {
    const pdfs = await Pdf.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePdf = async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    if (pdf.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this PDF' });
    }

    await pdf.deleteOne();
    res.json({ message: 'PDF removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
