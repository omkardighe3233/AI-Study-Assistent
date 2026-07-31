import express from 'express';
import { getNotes, createNote, updateNote, togglePinNote, deleteNote } from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getNotes)
  .post(protect, createNote);

router.route('/:id')
  .put(protect, updateNote)
  .delete(protect, deleteNote);

router.route('/:id/pin')
  .put(protect, togglePinNote);

export default router;
