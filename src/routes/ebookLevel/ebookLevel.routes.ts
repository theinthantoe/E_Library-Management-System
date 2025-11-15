import { Router } from 'express';
import EbookLevelController from "../../controllers/EbookLevelController";
import ebookLevelValidatior from "./ebookLevel.request";
import validate from "../../middlewares/validate.middleware";
import {authMiddleware, permissionMiddleware} from "../../middlewares/auth.middleware";
import {parsePagination} from "../../helpers/pagination";
const router = Router();
const controller = new EbookLevelController();



/**
 * @swagger
 * tags:
 *   name: Ebook Levels
 *   description: Ebook Level management
 */
router.post('/create/:moduleId',authMiddleware,permissionMiddleware('create'),validate(ebookLevelValidatior.createEbookLevel),controller.createEbookLevel);

/**
 * @swagger
 * /ebook-level/create:
 *   post:
 *     summary: Create all ebook levels
 *     tags: [Ebook Levels]
 *     responses:
 *       200:
 *         description: Create ebook levels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 */
router.get('/list/:moduleId',authMiddleware,permissionMiddleware('read'),parsePagination,controller.getAllEbookLevel);
/**
 * @swagger
 * /ebook-level/list:
 *   get:
 *     summary: Retrieve all ebook levels
 *     tags: [Ebook Levels]
 *     responses:
 *       200:
 *         description: A list of ebook levels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 */
router.get('/get/:id/:moduleId',authMiddleware,permissionMiddleware('read'),validate(ebookLevelValidatior.validateEbookLevelId),controller.getByIdEbookLevel)
/**
 * @swagger
 * /ebook-level/get/:id:
 *   get:
 *     summary: Retrieve  single ebook level
 *     tags: [Ebook Levels]
 *     responses:
 *       200:
 *         description: Single  ebook level
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 */
router.patch('/update/:id/:moduleId',authMiddleware,permissionMiddleware('update'),validate(ebookLevelValidatior.updateEbookLevel),controller.updateEbookLevel);

/**
 * @swagger
 * /ebook-level/update/:id:
 *   patch:
 *     summary: Retrieve  single ebook level
 *     tags: [Ebook Levels]
 *     responses:
 *       200:
 *         description: Single  ebook level
 *       404:
 *         description: Ebook level not found
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 */
router.delete('/delete/:id/:moduleId',authMiddleware,permissionMiddleware('delete'),validate(ebookLevelValidatior.deleteEbookLevel),controller.deleteEbookLevel);
/**
 * @swagger
 * /ebook-level/delete/:id:
 *   delete:
 *     summary: Delete an ebook level by ID
 *     tags: [Ebook Levels]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the ebook level to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ebook level successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Ebook level not found
 */

export  default router;