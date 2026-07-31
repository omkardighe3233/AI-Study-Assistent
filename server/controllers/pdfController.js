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
    const cleanName = req.file.originalname.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const publicId = `${Date.now()}_${cleanName}.pdf`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'study_sphere',
      resource_type: 'raw',
      public_id: publicId,
    });

    // 3. Generate Summary using Sarvam AI
    let summary = 'Summary not available.';
    if (process.env.SARVAM_API_KEY) {
      try {
        const prompt = `Please analyze the following document thoroughly and generate a comprehensive, highly detailed study guide and brief summary.

Format the response cleanly in Markdown with the following structured sections:
1. 📌 **Executive Overview & Core Objectives**: A thorough overview explaining the primary topic, thesis, and core purpose of the document.
2. 🔑 **Key Concepts & Detailed Topics**: In-depth explanation of key principles, theories, equations, or arguments mentioned.
3. 📝 **Comprehensive Section-by-Section Bullet Points**: Detailed and extensive bullet points covering all important facts, sub-topics, and details without skipping key information.
4. 💡 **Key Takeaways & Essential Definitions**: Definitions of critical terminology, formulas, and main conclusions.
5. ❓ **Practice & Review Questions**: 3 to 5 study questions to test understanding of the material.

Do not include conversational filler. Be clear, analytical, detailed, and comprehensive.

Document Text:
${pdfText.substring(0, 35000)}`;
        
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
      pdfText: pdfText ? pdfText.substring(0, 40000) : '',
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

export const getPdfById = async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ message: 'PDF document not found' });
    }
    if (pdf.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to access this PDF' });
    }
    res.json(pdf);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePdfHighlights = async (req, res) => {
  try {
    const { highlights } = req.body;
    let pdf = await Pdf.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({ message: 'PDF document not found' });
    }
    if (pdf.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    pdf.highlights = highlights || [];
    const updatedPdf = await pdf.save();
    res.json(updatedPdf);
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
