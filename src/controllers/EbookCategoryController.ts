import{EbookCategory} from "../models/EbookCategory";
import BaseController from "./BaseController";
import {NextFunction, Request, Response} from "express";
import {Messages} from "../utils/Messages";
import {EBook} from "../models/Ebook";
import {builderPagination} from "../helpers/pagination";
import {logAction} from "../middlewares/auth.middleware";

class EbookCategoryController extends BaseController{
    constructor() {
        super();
        this.createCategory = this.createCategory.bind(this)
        this.getAllCategories = this.getAllCategories.bind(this);
        this.getByIdCategory = this.getByIdCategory.bind(this);
        this.updateCategory = this.updateCategory.bind(this);
        this.deleteCategory =  this.deleteCategory.bind(this);
    }
    async  createCategory(req: Request, res :Response,next : NextFunction) {
        try{
            const {name} = req.body;
            const category : any = new EbookCategory({name})
            await category.save();
            await logAction(
                `created a new ebook category titled "${name}"`,
                "create",
                req
            );
            this.respondCreated(res, category,Messages.created)
        }catch (error){
            next(error);
        }
    }
    async getAllCategories(req: Request, res :Response,next: NextFunction) {
        try{
            const {page,limit,offset} = (req as any).pagination;
            const {search } = (req as any).query;
            const filters :any= {}
            if (search) {
                const regex = new RegExp(search, 'i'); // Case-insensitive search
                filters.$or = [
                    { name: regex },
                   // Add fields as needed
                ];
            }
            const categories = await EbookCategory.find(filters)
                .sort({createdAt: -1})
                .limit(limit)
                .skip(offset);
            const totalCounts = await EbookCategory.countDocuments(filters);
            console.log(totalCounts)
            const pagination = builderPagination(totalCounts,offset,limit)
            this.respondSuccessWithPaginator(res,categories,pagination,Messages.DATA_LIST)
        }catch (error){
            next(error);
        }
    }
    async getByIdCategory (req: Request, res :Response,next: NextFunction) {
        try{
            const {id } = req.params;
            const category  = await  EbookCategory.findById(id);
            if(!category){
                this.responseNotFound(res,Messages.notFound)
            }
            this.respondSuccess(res, category,Messages.getOne)
        }catch(error){
            next(error);
        }
    }
    async updateCategory (req: Request, res :Response,next: NextFunction) {
        const {id } = req.params;
        const {name} = req.body;
        const category = await  EbookCategory.findByIdAndUpdate(id,{name},{new : true})
        if(!category) {
            this.responseNotFound(res,Messages.notFound);
            return;
        }
        await logAction(
            `update a new ebook category titled "${name}"`,
            "update",
            req
        );
        this.respondSuccess(res, category,Messages.updated)
    }
    async  deleteCategory (req: Request, res :Response,next: NextFunction) {
        const {id} = req.params;
        const book = await EBook.countDocuments({ebookCategory: id})
        if(book > 0){
            this.responseBadRequest(res,Messages.delete_category)
            return;
        }
        const category : any = await EbookCategory.findByIdAndDelete(id)
        await logAction(
            `delete a new ebook category titled "${category.name}"`,
            "delete",
            req
        );
        this.respondSuccess(res,Messages.deleted)
    }
}

export default EbookCategoryController;