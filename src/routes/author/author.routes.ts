import { Router } from 'express';
import AuthorController from "../../controllers/AuthorController"
import {parsePagination} from "../../helpers/pagination";
import {authMiddleware, permissionMiddleware} from "../../middlewares/auth.middleware";
import {upload} from "../../service/awsService";
import validate from "../../middlewares/validate.middleware";
import authorValidator from "./author.request";
const controller = new AuthorController()
const router = Router();

router.post('/create/:moduleId',authMiddleware,permissionMiddleware('create'),upload.single('image'),validate(authorValidator.createAuthor),controller.createAuthor);
router.get('/list/:moduleId',authMiddleware,permissionMiddleware('read'),parsePagination,controller.getAllAuthors);
router.get('/get/:id/:moduleId',authMiddleware,permissionMiddleware('read'),validate(authorValidator.validateId),controller.getAuthor);
router.patch('/update/:id/:moduleId',authMiddleware,permissionMiddleware('update'),upload.single('image'),validate(authorValidator.updateAuthor),controller.updateAuthor);
router.delete('/delete/:id/:moduleId',authMiddleware,permissionMiddleware('delete'),validate(authorValidator.validateId),controller.deleteAuthor);
router.post('/bulk-upload/:moduleId',authMiddleware,permissionMiddleware('create'),upload.single('file'),controller.bulkUpload)

export default router;