import Quiz from '../models/Quiz.js';
import Pdf from '../models/Pdf.js';
import axios from 'axios';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Helper to generate subject-specific quiz questions directly from PDF content lines/summary
const generateSubjectTopicQuiz = (pdf) => {
  const rawContent = (pdf.pdfText && pdf.pdfText.length > 50) 
    ? pdf.pdfText 
    : (pdf.summary || pdf.title || '');

  // Extract meaningful clean content lines (excluding markdown headers/bullets)
  const lines = rawContent
    .split('\n')
    .map(l => l.replace(/[*#_📌🔑📝💡❓\-\d.]/g, '').trim())
    .filter(l => l.length > 25);

  const topicName = pdf.title ? pdf.title.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') : 'Subject Material';

  return [
    {
      question: lines[0] 
        ? `Regarding ${topicName}: What key subject principle states that "${lines[0].substring(0, 75)}..."?` 
        : `Which key technical concept is fundamental to ${topicName}?`,
      options: [
        lines[0] ? lines[0].substring(0, 70) : `Core mechanism of ${topicName}`,
        'Unrelated external process',
        'Deprecated legacy protocol',
        'Default system override'
      ],
      correctAnswer: lines[0] ? lines[0].substring(0, 70) : `Core mechanism of ${topicName}`
    },
    {
      question: lines[1] 
        ? `In the study of ${topicName}: Which statement is true regarding "${lines[1].substring(0, 70)}..."?` 
        : `What primary process takes place in ${topicName}?`,
      options: [
        lines[1] ? lines[1].substring(0, 70) : `Essential rule of ${topicName}`,
        'Random uncoordinated state',
        'Static arbitrary calculation',
        'None of the above'
      ],
      correctAnswer: lines[1] ? lines[1].substring(0, 70) : `Essential rule of ${topicName}`
    },
    {
      question: lines[2] 
        ? `Which definition accurately describes this key topic in ${topicName}: "${lines[2].substring(0, 70)}..."?` 
        : `What function does the core mechanism perform in ${topicName}?`,
      options: [
        lines[2] ? lines[2].substring(0, 70) : `Definition and rule of ${topicName}`,
        'Contradictory theory assumption',
        'Manual override operation',
        'Temporary placeholder'
      ],
      correctAnswer: lines[2] ? lines[2].substring(0, 70) : `Definition and rule of ${topicName}`
    },
    {
      question: lines[3] 
        ? `What important concept or fact is highlighted in ${topicName}: "${lines[3].substring(0, 70)}..."?` 
        : `Which parameter is critical when evaluating ${topicName}?`,
      options: [
        lines[3] ? lines[3].substring(0, 70) : `Key subject takeaway of ${topicName}`,
        'Immediate execution termination',
        'Skipping validation checks',
        'Random memory allocation'
      ],
      correctAnswer: lines[3] ? lines[3].substring(0, 70) : `Key subject takeaway of ${topicName}`
    },
    {
      question: lines[4] 
        ? `How does "${lines[4].substring(0, 70)}..." function within ${topicName}?` 
        : `What is the ultimate objective when applying principles of ${topicName}?`,
      options: [
        lines[4] ? lines[4].substring(0, 70) : `Practical subject application of ${topicName}`,
        'Bypassing system security',
        'Disabling primary features',
        'Executing without verification'
      ],
      correctAnswer: lines[4] ? lines[4].substring(0, 70) : `Practical subject application of ${topicName}`
    }
  ];
};

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

    let pdfText = pdf.pdfText;

    // Fallback if pdfText is missing (legacy PDF)
    if (!pdfText || !pdfText.trim()) {
      try {
        const response = await axios.get(pdf.cloudinaryUrl, { 
          responseType: 'arraybuffer',
          timeout: 10000 
        });
        const pdfData = await pdfParse(response.data);
        pdfText = pdfData.text;
      } catch (dlError) {
        console.warn('Could not download PDF binary, using summary:', dlError.message);
        pdfText = pdf.summary || pdf.title;
      }
    }

    // Use concise, high-value text sample (~4,000 characters) so Sarvam 105b responds rapidly (within 5-10s)
    const safeText = pdfText ? pdfText.substring(0, 4000) : (pdf.summary || pdf.title);

    const prompt = `You are an expert academic professor creating a 5-question multiple-choice practice test for a student based on the study text provided.

STRICT REQUIREMENTS:
1. Ask direct subject-matter questions on the ACTUAL TOPIC, concepts, formulas, rules, and facts present in the text (e.g. if the text is about Memory Management, ask technical questions about Paging, Virtual Memory, Allocation, etc.).
2. Do NOT ask meta-questions about the file or document itself (e.g. do NOT ask "What is the title of this file?" or "What is this document about?").
3. Each question MUST have 4 realistic options and 1 exact correct answer.
4. Output ONLY a valid JSON object matching the schema below, without markdown codeblocks or conversational text.

JSON Schema:
{
  "questions": [
    {
      "question": "Subject-matter question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A"
    }
  ]
}

Study Text:
${safeText}`;

    let questions = [];

    if (process.env.SARVAM_API_KEY) {
      try {
        const aiResponse = await axios.post(
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
            timeout: 30000,
          }
        );

        const rawText = aiResponse.data.choices[0]?.message?.content || '';
        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
          const parsedData = JSON.parse(cleanedText);
          questions = parsedData.questions || (Array.isArray(parsedData) ? parsedData : []);
        } catch (parseError) {
          const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedData = JSON.parse(jsonMatch[0]);
            questions = parsedData.questions || [];
          }
        }
      } catch (aiErr) {
        console.error('Sarvam 105b quiz request error:', aiErr.response?.data || aiErr.message);
      }
    }

    // Filter out meta-questions if any slip through
    if (Array.isArray(questions) && questions.length > 0) {
      questions = questions.filter(q => 
        q.question &&
        !q.question.toLowerCase().includes('what is the title of') &&
        !q.question.toLowerCase().includes('what is this file') &&
        !q.question.toLowerCase().includes('what is this document')
      );
    }

    // Fallback if AI didn't return valid subject questions
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.log('Generating subject-matter extracted quiz questions for PDF:', pdf.title);
      questions = generateSubjectTopicQuiz(pdf);
    }

    const quiz = await Quiz.create({
      title: `Quiz: ${pdf.title}`,
      pdfId: pdf._id,
      userId: req.user._id,
      questions,
    });

    res.status(201).json(quiz);
  } catch (error) {
    console.error('Quiz Generation Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate quiz' });
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
