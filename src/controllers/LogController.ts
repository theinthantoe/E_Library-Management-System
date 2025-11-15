import { Request, Response, NextFunction } from "express";
import { ActionLog } from "../models/ActionLog";
import { AdminLog } from "../models/AdminLog";
import { builderPagination } from "../helpers/pagination";
import BaseController from "./BaseController";
import {Messages} from "../utils/Messages";

class LogsController extends BaseController{
    constructor() {
        super();
        this.getActionLogs = this.getActionLogs.bind(this);
        this.getAdminLogs = this.getAdminLogs.bind(this);
    }
    async getActionLogs (req: Request, res: Response,next: NextFunction) {
        try {
            const { page, limit, offset } = (req as any).pagination;  // Destructure pagination data
            const logs = await ActionLog.find().sort({createdAt : -1}).limit(limit).skip(offset);
            const totalCounts = await ActionLog.countDocuments();
            const pagination = builderPagination(totalCounts, offset, limit);

            this.respondSuccessWithPaginator(res,logs,pagination,Messages.DATA_LIST)

        } catch (err) {
            next(err);  // Forward the error to the error handler middleware
        }
    }
    async getAdminLogs (req: Request, res: Response,next: NextFunction) {
        try{
            const { page, limit, offset } = (req as any).pagination;  // Destructure pagination data
            const logs = await AdminLog.find().sort({createdAt : -1}).limit(limit).skip(offset);
            const totalCounts = await AdminLog.countDocuments();
            const pagination = builderPagination(totalCounts, offset, limit);

           this.respondSuccessWithPaginator(res,logs,pagination,Messages.DATA_LIST)
        }catch(error){
            next(error);
        }
    }
}

export  default LogsController;


