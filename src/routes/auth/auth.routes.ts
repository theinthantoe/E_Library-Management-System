import { Router } from 'express';
import AuthController from "../../controllers/AuthController";
import validate from "../../middlewares/validate.middleware";
import authValidator from "./auth.request";

import dotenv from "dotenv";
import {authMiddleware, permissionMiddleware} from "../../middlewares/auth.middleware";
import {parsePagination} from "../../helpers/pagination";
import {upload} from "../../service/awsService";

const router = Router();
const controller = new AuthController();
dotenv.config()

// Super Admin
router.post("/super-admin/login",controller.loginSuperAdmin);
router.post("/super-admin/create/:moduleId",authMiddleware,permissionMiddleware('create'),upload.single('image'), validate(authValidator.createSuperAdmin), controller.createSuperAdmin);
router.get('/super-admin/list/:moduleId',authMiddleware,permissionMiddleware('read'),parsePagination,controller.getSuperAdmins);
router.get('/super-admin/get/:id', authMiddleware,controller.getSuperAdminById);
router.patch("/super-admin/update/:id",authMiddleware,upload.single('image'), controller.updateSuperAdmin);
router.delete("/super-admin/delete/:id/:moduleId",authMiddleware,permissionMiddleware('delete'), controller.deleteSuperAdmin);
router.post('/super-admin/send-otp',controller.sendOtp);
router.post('/super-admin/verify-otp',authMiddleware,controller.verifyOtp);
router.post('/super-admin/reset-password',authMiddleware,controller.resetPassword);
router.patch('/super-admin/change-password',authMiddleware,controller.changePassword);


// Role Routes
router.post("/role/create/:moduleId",authMiddleware,permissionMiddleware('create'), validate(authValidator.createRole), controller.createRoles);
router.get("/role/list/:moduleId",authMiddleware,permissionMiddleware('read'),parsePagination,validate(authValidator.getAll), controller.getRoles); // For pagination & search
router.get("/role/get/:id", authMiddleware,validate(authValidator.validateId), controller.getRole); // For getting a specific role
router.patch("/role/update/:id/:moduleId",authMiddleware,permissionMiddleware('update'), validate(authValidator.validateId), validate(authValidator.updateRole), controller.updateRole); // For updating a role
router.delete("/role/delete/:id/:moduleId",authMiddleware,permissionMiddleware('delete'), validate(authValidator.validateId), controller.deleteRole); // For deleting a role

// Permissions Routes
router.post("/permission/create/:moduleId",authMiddleware,permissionMiddleware('create'), validate(authValidator.createPermission), controller.createPermission);
router.get("/permission/list/:moduleId",authMiddleware,permissionMiddleware('read'), validate(authValidator.getAll), controller.getPermissions); // For pagination & search
router.get("/permission/get/:id",authMiddleware, validate(authValidator.validateId), controller.getPermission); // For getting a specific permission
router.patch("/permission/update/:id/:moduleId",authMiddleware,permissionMiddleware('update'), validate(authValidator.validateId), validate(authValidator.updatePermission), controller.updatePermission); // For updating a permission
router.delete("/permission/delete/:id/:moduleId",authMiddleware,permissionMiddleware('delete'), validate(authValidator.validateId), controller.deletePermission); // For deleting a permission

//Module routes
router.post("/module/create/:moduleId",authMiddleware,permissionMiddleware('create'),validate(authValidator.createModule), controller.createModule);
router.get('/module/list/:moduleId',authMiddleware,permissionMiddleware('read'),controller.getModules);
router.get('/module/get/:id/:moduleId',authMiddleware,permissionMiddleware('read'),controller.getModuleById);
router.patch('/module/update/:id/moduleId',authMiddleware,permissionMiddleware('update'), validate(authValidator.updateModule), controller.updateModule);
router.delete('/module/delete/:id/moduleId',authMiddleware,permissionMiddleware('delete'),validate(authValidator.validateId), controller.deleteModule);

export default router;
