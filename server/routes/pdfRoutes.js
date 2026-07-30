import express from 'express';
import { uploadPdf, getPdfs, deletePdf } from '../controllers/pdfController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../utils/multer.js';

const router = express.Router();

router.route('/')
  .get(protect, getPdfs)
  .post(protect, upload.single('file'), uploadPdf);

router.route('/:id')
  .delete(protect, deletePdf);

export default router;
