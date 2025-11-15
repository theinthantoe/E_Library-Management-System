import {EbookLevel} from '../models/EbookLevel';
import {EBook} from "../models/Ebook";
import BaseController from "./BaseController";
import  {Request,Response,NextFunction} from "express";
import {Messages} from "../utils/Messages";
import {builderPagination} from "../helpers/pagination";
import {logAction} from "../middlewares/auth.middleware";

class EbookLevelController extends  BaseController {
    constructor() {
        super();
        this.createEbookLevel = this.createEbookLevel.bind(this);
        this.getAllEbookLevel = this.getAllEbookLevel.bind(this);
        this.getByIdEbookLevel = this.getByIdEbookLevel.bind(this);
        this.updateEbookLevel = this.updateEbookLevel.bind(this);
        this.deleteEbookLevel = this.deleteEbookLevel.bind(this);
    }
    async  createEbookLevel(req: Request, res :Response,next : NextFunction) {
        try{
            const {name } = req.body;
            const newEbookLevel : any = new EbookLevel({name})
            await newEbookLevel.save();
            await logAction(
                `created a  ebook level titled "${name}"`,
                "create",
                req
            );
            this.respondCreated(res, newEbookLevel,Messages.created)
        }catch (error){
            next(error);
        }
    }
    async getAllEbookLevel(req: Request, res :Response,next: NextFunction) {
        try{
            const {page,limit,offset} = (req as any).pagination;
            const ebookLevels = await  EbookLevel.find().sort({createdAt : -1}).limit(limit).skip(offset)
            const counts = await EBook.countDocuments();
            const pagination = builderPagination(counts,offset,limit)
            this.respondSuccessWithPaginator(res, ebookLevels,pagination,Messages.DATA_LIST)
        }catch (error){
            next(error);
        }
    }
    async  getByIdEbookLevel(req: Request, res :Response,next: NextFunction) {
        try {
            const {id} = req.params;
            const ebookLevel = await  EbookLevel.findById(id)
            if(!ebookLevel) {
                this.responseNotFound(res,Messages.notFound)
            }
            this.respondSuccess(res, ebookLevel,Messages.getOne)
        }catch (error){
            next(error);
        }
    }
    async updateEbookLevel(req: Request, res :Response,next: NextFunction) {
        try{
            const {id}= req.params;
            const {name} = req.body;
            console.log(name)
            const ebookLevel = await  EbookLevel.findByIdAndUpdate(id, {name},{new : true})
            if(!ebookLevel) {
                this.responseNotFound(res,Messages.notFound)
                return
            }
            await logAction(
                `updated a ebook level  titled "${name}"`,
                "update",
                req
            );
            this.respondSuccess(res, ebookLevel,Messages.updated)

        }catch (error){
            next(error);
        }
    }
    async deleteEbookLevel(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            // Check if any eBooks are associated with this ebookLevel
            const ebookWithLevel = await EBook.countDocuments({ ebookLevel: id });

            // Log the count for debugging purposes
            console.log(`eBooks with this level: ${ebookWithLevel}`);

            // If there are eBooks associated with the ebookLevel, prevent deletion
            if (ebookWithLevel > 0) {
                 this.responseBadRequest(res, Messages.delete_level); // eBooks are using this level
                return

            }

            // Attempt to delete the ebookLevel
            const level : any = await EbookLevel.findByIdAndDelete(id);

            if (!level) {
                 this.responseNotFound(res, Messages.notFound); // EbookLevel not found
                return
            }

            await logAction(
                `deleted a ebook level titled "${level.name}"`,
                "delete",
                req
            );

            // Successfully deleted
            this.respondSuccess(res, Messages.deleted);
        } catch (error) {
            next(error); // Handle any errors
        }
    }

}
export default  EbookLevelController;