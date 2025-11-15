import  {Router} from "express";
import ebookCategoryController from "../../controllers/EbookCategoryController";
import validate from "../../middlewares/validate.middleware";
import categoryValidation from "./ebookCategory.request";
import {authMiddleware, permissionMiddleware} from "../../middlewares/auth.middleware";
import {parsePagination} from "../../helpers/pagination";
const router = Router();
const controller = new ebookCategoryController();

router.post('/create/:moduleId',authMiddleware,permissionMiddleware('create'),validate(categoryValidation.createCategory),controller.createCategory)
router.get('/list/:moduleId',authMiddleware,permissionMiddleware('read'),parsePagination,controller.getAllCategories)
router.get('/get/:id/:moduleId',authMiddleware,permissionMiddleware('read'),validate(categoryValidation.validateCategoryId),controller.getByIdCategory)
router.patch('/update/:id/:moduleId',authMiddleware,permissionMiddleware('update'),validate(categoryValidation.updateCategory),controller.updateCategory)
router.delete('/delete/:id/:moduleId',authMiddleware,permissionMiddleware('delete'),validate(categoryValidation.deleteCategoryId),controller.deleteCategory)

export default router;