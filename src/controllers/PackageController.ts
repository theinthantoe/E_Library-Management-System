import {Request, Response,NextFunction} from "express";
import {Package} from "../models/Package";
import baseController from "./BaseController";
import {Messages} from "../utils/Messages";
import {builderPagination} from "../helpers/pagination"
import {Customer} from "../models/Customer";
import {logAction} from "../middlewares/auth.middleware";

class PackageController extends  baseController {
    constructor() {
        super();
        this.createPackage = this.createPackage.bind(this);
        this.getAllPackages = this.getAllPackages.bind(this);
        this.getPackage = this.getPackage.bind(this);
        this.updatePackage = this.updatePackage.bind(this);
        this.deletePackage = this.deletePackage.bind(this);
    }
    async  createPackage(req: Request, res :Response,next : NextFunction) {
        try{
            const packageData = req.body;
            console.log(packageData);
            const newPackage : any = new Package(packageData)
            await newPackage.save();
            await logAction(
                `created a package titled "${newPackage.name}"`,
                "create",
                req
            );
            this.respondCreated(res, newPackage,Messages.created)
        }catch (error){
            next(error);
        }
    }
    async getAllPackages (req: Request, res :Response,next: NextFunction) {
        try{
            const {page,limit,offset} = (req as any).pagination;
            const packages = await  Package.find().sort({createdAt : -1}).limit(limit).skip(offset);
            const totalCounts = await  Package.countDocuments();
            const pagination = builderPagination(totalCounts,offset,limit);
            this.respondSuccessWithPaginator(res,packages,pagination,Messages.DATA_LIST)

        }catch (error){
            next(error);
        }
    }
    async getPackage (req: Request, res :Response,next: NextFunction) {
        try{
            const {id} = req.params;
            const packages : any = await Package.findById(id);
            if(!packages){
                this.responseNotFound(res,Messages.notFound)
            }
            this.respondSuccess(res,packages,Messages.getOne)
        }catch(error){
            next(error);
        }
    }
    async updatePackage (req: Request, res :Response,next: NextFunction) {
        try{
            const {id} = req.params;
            const updatedPackage : any = await  Package.findByIdAndUpdate(id,req.body,{new : true})
            if(!updatedPackage) {
                this.responseNotFound(res,Messages.notFound);
                return
            }
            await logAction(
                `updated a package titled "${updatedPackage.name}"`,
                "update",
                req
            );
            this.respondSuccess(res,updatedPackage,Messages.updated)
        }catch (error){
            next(error);
        }
    }

    async deletePackage (req: Request, res :Response,next: NextFunction) {
        try {
            const {id} = req.params;
            const packageWithCustomer = await Customer.countDocuments({packageId:  id});
            if(packageWithCustomer > 0){
                this.responseBadRequest(res,Messages.delete_package);
                return
            }
            const deletePackage :any = await  Package.findByIdAndDelete(id);
            if (!deletePackage) {
                this.responseNotFound(res,Messages.notFound)
                return;
            }
            await logAction(
                `deleted a  package titled "${deletePackage.name}"`,
                "delete",
                req
            );
            this.respondSuccess(res,deletePackage,Messages.deleted)
        }catch (error){
            next(error);
        }
    }
}

export default  PackageController