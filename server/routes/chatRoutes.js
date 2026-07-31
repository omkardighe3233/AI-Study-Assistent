import express from 'express';
import {
  getChats,
  getChatById,
  createChat,
  sendMessage,
  deleteChat,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getChats)
  .post(createChat);

router.route('/message')
  .post(sendMessage);

router.route('/:id')
  .get(getChatById)
  .delete(deleteChat);

router.route('/:id/message')
  .post(sendMessage);

export default router;
