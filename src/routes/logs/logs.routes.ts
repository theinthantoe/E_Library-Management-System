import { Router } from 'express';
import LogsController from "../../controllers/LogController";
import {authMiddleware, permissionMiddleware} from "../../middlewares/auth.middleware";
import {parsePagination} from "../../helpers/pagination";
const router = Router();
const controller = new LogsController();

router.get('/action-logs/:moduleId',authMiddleware,permissionMiddleware('read'),parsePagination,controller.getActionLogs)
router.get('/admin-logs/:moduleId',authMiddleware,permissionMiddleware('read'),parsePagination,controller.getAdminLogs)

export default router;