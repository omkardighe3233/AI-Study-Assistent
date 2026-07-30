import Quiz from '../models/Quiz.js';
import Pdf from '../models/Pdf.js';
import axios from 'axios';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export const generateQuiz = async (req, res) => {
  try {
    const { pdfId } = req.body;

    const pdf = await Pdf.findById(pdfId);
    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }
    if (pdf.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Since we don't store the raw text, we fetch the PDF from Cloudinary to parse it
    // Alternatively, we could have stored the raw text in MongoDB, but that could exceed document limits.
    const response = await axios.get(pdf.cloudinaryUrl, { responseType: 'arraybuffer' });
    const pdfData = await pdfParse(response.data);
    const pdfText = pdfData.text;

    if (!process.env.SARVAM_API_KEY) {
       return res.status(500).json({ message: 'SARVAM_API_KEY not configured.' });
    }

    const prompt = `
      You are an AI Quiz Generator. Based on the following text, generate a quiz with exactly 5 multiple choice questions.
      You MUST output a valid JSON object with a single key "questions" containing an array of the questions.
      Make sure to properly escape all quotes inside strings.
      The structure must match exactly:
      {
        "questions": [
          {
            "question": "The question text here",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The exact string of the correct option"
          }
        ]
      }
      
      Text to use:
      ${pdfText.substring(0, 30000)}
    `;

    const aiResponse = await axios.post(
      'https://api.sarvam.ai/v1/chat/completions',
      {
        model: 'sarvam-105b',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        reasoning_effort: 'low',
        max_tokens: 3000
      },
      {
        headers: {
          'api-subscription-key': process.env.SARVAM_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const rawText = aiResponse.data.choices[0].message.content;
    if (!rawText) {
      throw new Error('AI response content was empty or null (possibly hit a length limit).');
    }

    let questions;
    
    try {
      const parsedData = JSON.parse(rawText);
      questions = parsedData.questions;
      if (!Array.isArray(questions)) throw new Error("Parsed data does not contain a 'questions' array");
    } catch (parseError) {
      // Fallback regex extraction if the model still wrapped it in markdown
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]).questions;
      } else {
        throw new Error('AI did not return valid JSON');
      }
    }

    const quiz = await Quiz.create({
      title: `Quiz for ${pdf.title}`,
      pdfId: pdf._id,
      userId: req.user._id,
      questions,
    });

    res.status(201).json(quiz);
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ userId: req.user._id }).sort({ createdAt: -1 }).populate('pdfId', 'title');
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const { score } = req.body;
    let quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    quiz.score = score;
    quiz.completed = true;
    const updatedQuiz = await quiz.save();

    res.json(updatedQuiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
