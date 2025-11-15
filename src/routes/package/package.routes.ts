import { Router } from 'express';
import PackageController from "../../controllers/PackageController";
import validate from "../../middlewares/validate.middleware";
import packageValidator from "./package.request";
import { parsePagination } from "../../helpers/pagination";
import {authMiddleware, permissionMiddleware} from "../../middlewares/auth.middleware";

const controller = new PackageController();
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Packages
 *   description: Packages management API
 */

/**
 * @swagger
 * /package/create:
 *   post:
 *     summary: Create a new package
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - duration
 *             properties:
 *               name:
 *                 type: string
 *                 unique: true
 *                 example: "Premium Package"
 *                 description: The name of the package.
 *               price:
 *                 type: number
 *                 example: 99.99
 *                 description: The price of the package.
 *               duration:
 *                 type: number
 *                 enum: [6, 1, 2]
 *                 example: 6
 *                 description: Duration in months (6, 1, or 2).
 *               subPackages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: objectId
 *                 example: ["60c72b2f5f1b2c001c8e4d1a", "60c72b2f5f1b2c001c8e4d1b"]
 *                 description: Array of sub-package ObjectIds.
 *               description:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Includes 1000 eBooks", "500 audiobooks"]
 *                 description: Description strings for the package.
 *     responses:
 *       201:
 *         description: Package created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "Premium Package"
 *                 price:
 *                   type: number
 *                   example: 99.99
 *                 duration:
 *                   type: number
 *                   example: 6
 *                 subPackages:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "60c72b2f5f1b2c001c8e4d1a"
 *                 description:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Includes 1000 eBooks", "500 audiobooks"]
 *       401:
 *         description: Unauthorized. Authentication required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       400:
 *         description: Invalid input or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid input"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "Name is required"
 */
router.post(
    '/create/:moduleId',
    authMiddleware,permissionMiddleware('create'),
    validate(packageValidator.createPackage),
    controller.createPackage
);

/**
 * @swagger
 * /package/list:
 *   get:
 *     summary: Retrieve a paginated list of packages
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page.
 *     responses:
 *       200:
 *         description: A paginated list of packages.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "60c72b2f5f1b2c001c8e4d1a"
 *                       name:
 *                         type: string
 *                         example: "Premium Package"
 *                       price:
 *                         type: number
 *                         example: 99.99
 *                       duration:
 *                         type: number
 *                         example: 6
 *                       subPackages:
 *                         type: array
 *                         items:
 *                           type: string
 *                           example: "60c72b2f5f1b2c001c8e4d1a"
 *                       description:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["Includes 1000 eBooks", "500 audiobooks"]
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     nextPage:
 *                       type: integer
 *                       example: 2
 *                     previousPage:
 *                       type: integer
 *                       example: null
 *       401:
 *         description: Unauthorized. Authentication required.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       400:
 *         description: Bad Request
 */
router.get('/list/:moduleId', authMiddleware,permissionMiddleware('read'), parsePagination, controller.getAllPackages);
router.get('/get/:id/:moduleId',authMiddleware,permissionMiddleware('read'),validate(packageValidator.validateId),controller.getPackage)
router.patch('/update/:id/:moduleId',authMiddleware,permissionMiddleware('update'),validate(packageValidator.validateId),controller.updatePackage)
router.delete('/delete/:id/:moduleId',authMiddleware,permissionMiddleware('delete'),validate(packageValidator.validateId),controller.deletePackage);

export default router;
