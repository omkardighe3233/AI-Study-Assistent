import express from 'express';
import { generateQuiz, getQuizzes, submitQuiz } from '../controllers/quizController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getQuizzes)
  .post(protect, generateQuiz);

router.route('/:id/submit')
  .post(protect, submitQuiz);

export default router;
