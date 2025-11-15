import { Router } from 'express';
import CustomerController from "../../controllers/CustomerController";
import {authMiddleware, permissionMiddleware} from "../../middlewares/auth.middleware";
import validate from "../../middlewares/validate.middleware";
import customerValidator from "./customer.request";
import {parsePagination} from "../../helpers/pagination";
const controller = new CustomerController();
const router = Router();
router.post('/create/:moduleId',authMiddleware,permissionMiddleware('create'),validate(customerValidator.createCustomer), controller.createCustomer);
router.get('/list/:moduleId',authMiddleware,permissionMiddleware('read'),parsePagination,controller.getCustomer);
router.get('/get/:id',authMiddleware,controller.getById);
router.post('/login-customer',controller.loginCustomer)
router.patch('/update/:id/:moduleId',authMiddleware,permissionMiddleware('update'),validate(customerValidator.updateCustomer),controller.updateCustomer)
router.delete('/delete/:id/:moduleId',authMiddleware,permissionMiddleware('delete'),validate(customerValidator.validateId),controller.deleteCustomer)
router.patch('/:id/renew/:moduleId',authMiddleware,permissionMiddleware('update'),controller.renewPackage)
router.post('/sync',authMiddleware,controller.syncData)
router.post('/reduce-user-limit',authMiddleware,controller.reduceUserLimit)
router.post('/increase-user-limit',authMiddleware,controller.increaseUserLimit)

export default router;