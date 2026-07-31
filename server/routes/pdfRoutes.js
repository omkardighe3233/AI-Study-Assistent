import express from 'express';
import { uploadPdf, getPdfs, getPdfById, updatePdfHighlights, deletePdf } from '../controllers/pdfController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../utils/multer.js';

const router = express.Router();

router.route('/')
  .get(protect, getPdfs)
  .post(protect, upload.single('file'), uploadPdf);

router.route('/:id')
  .get(protect, getPdfById)
  .delete(protect, deletePdf);

router.route('/:id/highlights')
  .put(protect, updatePdfHighlights);

export default router;
