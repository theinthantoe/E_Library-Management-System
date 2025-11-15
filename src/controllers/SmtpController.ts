import { Request, Response,NextFunction } from "express";
import {SmtpConfig} from "../models/SmtpConfig";
import BaseController from "./BaseController";
import {Messages} from "../utils/Messages";

class SmtpController extends BaseController{
    constructor() {
        super();
        this.getSmtp = this.getSmtp.bind(this);
        this.updateSmtp = this.updateSmtp.bind(this);
    }
    async  getSmtp (req: Request, res: Response, next: NextFunction) {
        try{
            const config = await SmtpConfig.findOne();
            this.respondSuccess(res, config,Messages.getOne);
        }catch (error){
            next(error);
        }
    }
    async updateSmtp (req: Request, res: Response, next: NextFunction){
        try{
            const {id} = req.params;
            const updates = req.body;
            const config = await SmtpConfig.findByIdAndUpdate(id,updates,{new : true})
            this.respondSuccess(res, config,Messages.updated);
        }catch (error){
            next(error);
        }
    }
}
export  default SmtpController