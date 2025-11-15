import { Router } from 'express';
import EbookController from "../../controllers/EbookController";
import validate from "../../middlewares/validate.middleware";
import ebookValidator from "./ebook.request";
import {upload} from "../../service/awsService";
import {authMiddleware, permissionMiddleware} from "../../middlewares/auth.middleware";
import {parsePagination} from "../../helpers/pagination";

const router = Router();
const controller = new EbookController();

// Create Ebook
router.post('/create/:moduleId',authMiddleware,permissionMiddleware('create'),upload.fields([{ name: 'cover' }, { name: 'book' }]), validate(ebookValidator.createEbook), controller.createEbook);

// Get All Ebooks (with pagination and optional search)
router.get('/list/:moduleId', authMiddleware,permissionMiddleware('read'),parsePagination,controller.getAllEbooks);

// Get Ebook by ID
router.get('/get/:id/:moduleId',authMiddleware,permissionMiddleware('read'),validate(ebookValidator.validateEbookId), controller.getEbookById);

// Update Ebook by ID
router.patch('/update/:id/:moduleId', authMiddleware,permissionMiddleware('update'),upload.fields([{name : 'cover'},{name : 'book'}]),validate(ebookValidator.updateEbook), controller.updateEbook);

// Delete Ebook by ID
router.delete('/delete/:id/:moduleId',authMiddleware,permissionMiddleware('delete'), validate(ebookValidator.deleteEbook), controller.deleteEbook);

router.post('/bulk-upload/:moduleId',authMiddleware,permissionMiddleware('create'),upload.single('file'),controller.bulkUpload)

router.get('/publish-year',authMiddleware,controller.getByYear)

export default router;
