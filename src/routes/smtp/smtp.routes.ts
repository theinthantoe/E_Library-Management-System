import express from "express";

const router = express.Router();
import smtpController from "../../controllers/SmtpController";
import {authMiddleware, permissionMiddleware} from "../../middlewares/auth.middleware";
import validate from "../../middlewares/validate.middleware";
import smtpValidator from "./smtp.request";
const controller = new smtpController();

router.get('/list/:moduleId',authMiddleware,permissionMiddleware('read'),controller.getSmtp)
router.patch('/update/:id/:moduleId',authMiddleware,permissionMiddleware('update'),validate(smtpValidator.update),controller.updateSmtp)

export default router;