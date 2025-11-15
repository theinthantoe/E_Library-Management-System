import { Request, Response, NextFunction } from "express";
import { Customer } from "../models/Customer";
import BaseController from "./BaseController";
import { Messages } from "../utils/Messages";
import {comparePassword, generateLicenseKey, hashPassword} from "../helpers/auth";
import dotenv from "dotenv";
import {builderPagination} from "../helpers/pagination";
import {Package} from "../models/Package";
import {calculateExpirationDate} from "../helpers/expirationDate";
import {generateToken, logAction} from "../middlewares/auth.middleware";
import {fetchSyncData} from "../utils/synCData";
dotenv.config();

class CustomerController extends BaseController {
    constructor() {
        super();
        this.createCustomer = this.createCustomer.bind(this);
        this.loginCustomer = this.loginCustomer.bind(this);
        this.getCustomer = this.getCustomer.bind(this);
        this.getById = this.getById.bind(this);
        this.updateCustomer = this.updateCustomer.bind(this);
        this.deleteCustomer = this.deleteCustomer.bind(this);
        this.renewPackage = this.renewPackage.bind(this);
        this.syncData = this.syncData.bind(this);
        this.reduceUserLimit = this.reduceUserLimit.bind(this);
        this.increaseUserLimit= this.increaseUserLimit.bind(this);
    }

    async createCustomer(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email,organization,phone_number, password, mongo_Url, packageId, userLimit } = req.body;

            const packageDetails : any = await Package.findById(packageId);
            if (!packageDetails) {
                 this.responseNotFound(res, Messages.notFound);
            }

            const expirationDate = calculateExpirationDate(new Date(), packageDetails.duration);

            const license_key = generateLicenseKey({ mongoUrl: mongo_Url, packageId, userLimit });
            const hashedPassword = await hashPassword(password);

            const newCustomer: any = new Customer({
                name,
                organization,
                phone_number,
                email,
                password: hashedPassword,
                mongo_Url,
                packageId,
                userLimit,
                remainUser : userLimit,
                license_key,
                expirationDate,
            });

            await newCustomer.save();
            await logAction(
                `created a new customer  "${newCustomer.name}"`,
                "create",
                req
            );
            this.respondCreated(res, newCustomer, Messages.created);
        } catch (error) {
            next(error);
        }
    }


    async getCustomer(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit, offset } = (req as any).pagination;
            const customers = await Customer.find()
                .sort({createdAt: -1})
                .limit(limit)
                .skip(offset)
                .populate("packageId");

            const totalCounts = await Customer.countDocuments();
            const pagination = builderPagination(totalCounts, offset, limit);
            this.respondSuccessWithPaginator(res, customers, pagination, Messages.DATA_LIST);
        } catch (error) {
            next(error);
        }
    }
    async getById(req: Request, res: Response, next: NextFunction) {
        try{
            const {id} = req.params;
            const customer = await Customer.findById(id).populate('packageId');
            this.respondSuccess(res,customer, Messages.getOne);
        }catch (error){
            next(error);
        }
    }

    async loginCustomer(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            console.log(req.body);
            const customer: any = await Customer.findOne({ email }).populate('packageId');

            if (!customer) {
                 this.responseNotFound(res,Messages.notFound);
            }

            const isMatch = await comparePassword(password, customer.password);
            if (!isMatch) {
                 this.responseBadRequest(res, Messages.INVALID);
            }

            const token =   generateToken({mongo_Url:customer.mongo_Url,email : customer.email,packageId :customer.packageId,expirationDate: customer.expirationDate,license_key :customer.license_key, _id : customer._id})

            // await syncData(customer, mainDbUrl);
            this.respondSuccess(res, token, Messages.successLogin);
        } catch (error) {
            next(error);
        }
    }

    async updateCustomer(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const updates = req.body;
            console.log(updates);

            if (updates.password) {
                updates.password = await hashPassword(updates.password);
            }

            const updatedCustomer : any = await Customer.findByIdAndUpdate(id, updates, { new: true });

            if (!updatedCustomer) {
                 this.responseNotFound(res, Messages.notFound);
                 return;
            }
            await logAction(
                `updated a customer titled "${updatedCustomer.name}"`,
                "update",
                req
            );

            this.respondSuccess(res, updatedCustomer, Messages.updated);
        } catch (error) {
            console.error("Error updating customer:", error);
            next(error);
        }
    }

    async deleteCustomer(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const deletedCustomer : any = await Customer.findByIdAndDelete(id);

            if (!deletedCustomer) {
                 this.responseNotFound(res, Messages.notFound);
            }
            await logAction(
                `deleted a customer titled "${deletedCustomer.name}"`,
                "delete",
                req
            );
            this.respondSuccess(res, null, Messages.deleted);
        } catch (error) {
            console.error("Error deleting customer:", error);
            next(error);
        }
    }
    async renewPackage(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { packageId } = req.body;

            const customer : any= await Customer.findById(id);
            if (!customer) {
                this.responseNotFound(res, Messages.notFound);
                return;
            }

            const packageDetails :any = await Package.findById(packageId);
            if (!packageDetails) {
                 this.responseNotFound(res, Messages.notFound);
                 return;
            }

            // Calculate new expiration date based on remaining time
            const now = new Date();
            const remainingDays = customer.expirationDate > now
                ? Math.ceil((customer.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                : 0;

            const newExpirationDate = calculateExpirationDate(now, packageDetails.duration + remainingDays);

            customer.packageId = packageId;
            customer.expirationDate = newExpirationDate;
            await customer.save();

            await logAction(
                `renewed a package titled "${customer.name}"`,
                "create",
                req
            );

            this.respondSuccess(res, {
                customerId: customer._id,
                newPackageId: packageId,
                newExpirationDate,
            }, Messages.updated);
        } catch (error) {
            next(error);
        }
    }
    async syncData(req: Request, res: Response, next: NextFunction) {
        try {
            // Step 1: Extract user information from the request (e.g., via middleware)
            const user = (req as any).user;
            console.log(user);
            if (!user) {
                 this.responseBadRequest(res, "User information is missing in the request.");
                return
            }

            // Step 2: Validate user information
            const customerId = user.license_key;
            if (!customerId) {
                 this.responseBadRequest(res, "Customer ID is required for synchronization.");
                return
            }

            // Step 3: Fetch customer details from the database
            const customer : any = await Customer.findOne({license_key:customerId});
            // console.log(customer)
            if (!customer) {
                 this.responseNotFound(res, "Customer not found.");
                return
            }
            const expiration = new Date(customer.expirationDate);
            const currentDate = new Date();
            // console.log(expiration,currentDate)

            const isExpired = expiration < currentDate;
            if(isExpired) {
                this.responseBadRequest(res, "Your license is expired.Please Contact info@obs.com.mm");
                return
            }


            // Step 5: Perform the synchronization
            const syncData = await  fetchSyncData(customer)
            // Step 6: Respond with success
            this.respondSuccess(res,syncData, Messages.DATA_LIST);
        } catch (error) {
            console.error("Error in syncData method:", error);
            next(error);
        }
    }
    async reduceUserLimit(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            if (!user) {
                this.responseBadRequest(res, "User information is missing in the request.");
                return
            }

            const customer: any = await Customer.findById(user.id);
            if (!customer) {
                this.responseNotFound(res, Messages.notFound);
                return
            }

            if (customer.remainUser > 0) {
                customer.remainUser -= 1;
                await customer.save();
                 this.respondSuccess(res, { remainUser: customer.remainUser }, Messages.updated);
                 return
            } else {
                 this.responseBadRequest(res, "User limit exceeded. Cannot create more users.");
                 return
            }
        } catch (error) {
            next(error);
        }
    }

    async increaseUserLimit(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as any).user;
            if (!user) {
                this.responseBadRequest(res, "User information is missing in the request.");
                return
            }

            const customer: any = await Customer.findById(user.id);
            if (!customer) {
                this.responseNotFound(res, Messages.notFound);
                return
            }


            if (customer.remainUser < customer.userLimit) {
                customer.remainUser += 1;
                await customer.save();
                 this.respondSuccess(res, { remainUser: customer.remainUser }, Messages.updated);
                 return
            } else {
                 this.responseBadRequest(res, "User limit is already at maximum.");
                 return
            }
        } catch (error) {
            next(error);
        }
    }

}

export default CustomerController;
