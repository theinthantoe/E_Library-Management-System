import { Request, Response, NextFunction } from "express";
import { Admin } from "../models/Admin";
import { Role } from "../models/Role";
import {Module} from "../models/Module";
import Permission from "../models/Permission";
import { spData } from "../interface/auth";
import BaseController from "./BaseController";
import {comparePassword, hashPassword} from "../helpers/auth";
import { Messages } from "../utils/Messages";
import {generateToken, AdminLogAction, logAction} from "../middlewares/auth.middleware";
import sendOtpEmail from "../service/mailService";
import {builderPagination} from "../helpers/pagination";
import {s3DelImage, s3UploadImage} from "../service/awsService";
import process from "node:process";
const otpGenerator = require('otp-generator');


class AuthController extends BaseController {
    constructor() {
        super();
        this.loginSuperAdmin =this.loginSuperAdmin.bind(this);
        this.createSuperAdmin = this.createSuperAdmin.bind(this);
        this.getSuperAdmins = this.getSuperAdmins.bind(this);
        this.getSuperAdminById = this.getSuperAdminById.bind(this);
        this.updateSuperAdmin = this.updateSuperAdmin.bind(this);
        this.deleteSuperAdmin = this.deleteSuperAdmin.bind(this);
        this.createRoles = this.createRoles.bind(this);
        this.updateRole = this.updateRole.bind(this);
        this.deleteRole = this.deleteRole.bind(this);
        this.getRoles = this.getRoles.bind(this);
        this.getRole = this.getRole.bind(this);
        this.createPermission = this.createPermission.bind(this);
        this.updatePermission = this.updatePermission.bind(this);
        this.deletePermission = this.deletePermission.bind(this);
        this.getPermissions = this.getPermissions.bind(this);
        this.getPermission = this.getPermission.bind(this);
        this.createModule = this.createModule.bind(this);
        this.getModules = this.getModules.bind(this);
        this.getModuleById= this.getModuleById.bind(this);
        this.updateModule = this.updateModule.bind(this);
        this.deleteModule = this.deleteModule.bind(this);
        this.sendOtp = this.sendOtp.bind(this);
        this.verifyOtp = this.verifyOtp.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
        this.changePassword =this.changePassword.bind(this);

    }
    //Login
    async  loginSuperAdmin(req: Request, res: Response, next: NextFunction) {
        const { email, password } = req.body;


        try {
            // Check if the admin exists
            const existingAdmin : any= await Admin.findOne({ email })
                .populate({
                    path: 'role',
                    populate: {
                        path: 'permissions',
                        model: 'Permission',
                        populate: {
                            path: 'module',
                            model: 'Module',
                        },
                    },
                });

            if (!existingAdmin) {
                this.responseNotFound(res,existingAdmin,Messages.notFound)
            }

            // Compare the password with the hashed password stored in the database
            const isMatch = await comparePassword(password, existingAdmin.password);
            if (!isMatch) {
                this.responseBadRequest(res,Messages.INVALID)
            }


            const token = generateToken({
                id: existingAdmin._id,
                name : existingAdmin.name,
                photo : existingAdmin.photo,
                email: existingAdmin.email,
                role: existingAdmin.role
            });



            // Log the details
            await AdminLogAction(
                 existingAdmin,req
            );



            // Return the token and user data (without the password)
           this.respondSuccess(res,token,Messages.successLogin)
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    }

    //Forgot Password
    async sendOtp (req: Request, res: Response, next: NextFunction) {   try {
        const { email }  = req.body
        let isExit = await Admin.find({
            email : email
        })
        if(!isExit){
            this.responseError(res,email,Messages.notFound)
        }
        let otp  = await otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false , digits:true,lowerCaseAlphabets:false });
        await sendOtpEmail(email,otp)
        // Generate OTP and token
        // let otp = "123456";
        let expTime = "100000";
        let otpCreatedTime = Date.now();

        const token = await generateToken({otp , email, expTime , otpCreatedTime});

        this.respondCreated(res,[{ expTime , otpCreatedTime,token}],Messages.OTPSuccess)
    } catch (error) {
        next(error)
    }
    }

    //Verify Otp
    async verifyOtp (req:Request,res:Response,next:NextFunction) {
        try {
            const { code } = req.body
            const {otp , otpExpiryTime,email}   = (req as any).user

            const currentTime = Date.now();

            // Check if the OTP has expired
            if (otpExpiryTime && currentTime > otpExpiryTime) {
                console.log("OTP expired");
                this.responseError(res,[],Messages.EXPIRE_TIME)
            }
            // Validate the OTP
            if (code == otp) {
                const token = await generateToken({email})
                this.respondSuccess(res,[{token}],Messages.VERIFY_OTP)
            } else {
                this.responseError(res,[],Messages.INVALID)
            }
        } catch (error) {
            console.log("invalid otp")
            next(error);
        }
    }

    //reset pwd
    async resetPassword(req: Request,res : Response,next : NextFunction){
        try {
            const {password , confirm_password} : {password :string, confirm_password : string}  = req.body
            //@ts-ignore
            const {email} = req.user;
            console.log(email)
            if(password !== confirm_password) this.responseError(res,req.body,Messages.passwordNoMatch)
            let hashpwd = await hashPassword(password)
            let [userData] = await Admin.find({email})
            console.log(userData)
            await Admin.findByIdAndUpdate(userData._id,{password : hashpwd})
            this.respondSuccess(res,userData,Messages.RESET_PWD)
        } catch (error) {
            next(error)
        }
    }

    async changePassword(req : Request, res : Response, next :NextFunction) {
        try {
            const { currentPassword, newPassword, confirmNewPassword } = req.body;

            const { email } = (req as any).user;


            // Check if new passwords match
            if (newPassword !== confirmNewPassword) {
                this.responseBadRequest(res,Messages.passwordNoMatch)
                return
            }

            const user : any = await Admin.findOne({ email });

            if (!user) {
                this.responseNotFound(res,Messages.notFound)
            }

            // Verify the current password
            const isMatch = await  comparePassword(currentPassword,user.password);  // Compare directly without hashing
            if (!isMatch) {
                this.responseBadRequest(res,Messages.INVALID)
            }

            // Hash the new password
            const hashedPassword = await hashPassword(newPassword);  // Hash new password with saltRounds

            // Update the user's password
            user.password = hashedPassword;
            await user.save();

            // Respond with success message
            this.respondSuccess(res,user,Messages.changePassword)
        } catch (error) {
            next(error);
        }
    }


    // Create Super Admin
    async createSuperAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, phone_number, password, role }: spData = req.body;
            const imageFile: any = req.file;
            let imageUrl: string | null = null;

            // Check if the admin with the given email already exists
            const existingAdmin: any = await Admin.findOne({ email });
            if (existingAdmin) {
                 this.responseBadRequest(res, Messages.exit);
            }

            // Handle file upload if a file is provided
            if (imageFile) {
                const imageKey = `Admin/${Date.now()}_${imageFile.originalname}`;

                // Upload the file to S3
                await s3UploadImage(imageFile.buffer, imageFile.mimetype, imageKey);

                // Construct the image URL
                imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${imageKey}`;
            }

            // Hash the password
            const hashedPassword = await hashPassword(password);

            // Create a new admin
            const newAdmin: any = await Admin.create({
                name,
                email,
                phone_number,
                password: hashedPassword,
                role,
                photo: imageUrl, // Save the image URL or null
            });

            await logAction(
                `created a new admin  titled "${newAdmin.name}"`,
                "create",
                req
            );

            // Respond with the created admin
            this.respondCreated(res, newAdmin, Messages.created);
        } catch (error) {
            console.error('Error creating super admin:', error);
            next(error);
        }
    }

    //Get Admin
    async getSuperAdmins (req: Request, res: Response, next: NextFunction){
        try {
            const {page ,limit,offset} = (req as any).pagination;
            const admins = await  Admin.find().sort({createdAt : -1}).limit(limit).skip(offset).populate({
                path: 'role',
                populate: {
                    path: 'permissions',
                    model: 'Permission',
                    populate: {
                        path: 'module',
                        model: 'Module',
                    },
                },
            });
            const totalCounts = await Admin.countDocuments();
            const pagination = builderPagination(totalCounts, offset,limit);
            this.respondSuccessWithPaginator(res, admins,pagination,Messages.DATA_LIST)
        }catch(error){
            next(error);
        }
    }
    //Get By Id
    async getSuperAdminById (req: Request, res: Response, next: NextFunction){
        try{
            const {id}= req.params;
            const admin = await Admin.findById(id).populate({
                path: 'role',
                populate: {
                    path: 'permissions',
                    model: 'Permission',
                    populate: {
                        path: 'module',
                        model: 'Module',
                    },
                },
            });
            if (!admin) {
                this.responseNotFound(res,admin,Messages.notFound)
            }
            this.respondSuccess(res,admin,Messages.getOne)
        }catch (error){
            next(error);
        }
    }
    //Update
    async updateSuperAdmin (req: Request, res: Response, next: NextFunction){
        try{
            const {id}= req.params;
            const existingAdmin : any = await  Admin.findById(id);
            if (!existingAdmin) {
                this.responseNotFound(res,existingAdmin,Messages.notFound)
            }
            let imageUrl = existingAdmin.image;
            if(req.file){
                const imageFile  = req.file;
                const imageKey = `Author/${imageFile?.originalname}`;
                await s3UploadImage(imageFile.buffer,imageFile.mimetype,imageKey);
                imageUrl = `https:${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${imageKey}`;
                if(existingAdmin.image){
                    await s3DelImage(existingAdmin.image);
                }
            }
            const hashpassword = req.body.password
                ? await hashPassword(req.body.password)
                : existingAdmin.password;

            const updatedAdmin = {
                name: req.body.name ?? existingAdmin.name,
                email: req.body.email ?? existingAdmin.email,
                phone_number: req.body.phone ?? existingAdmin.phone_number,
                password: hashpassword,
                photo : imageUrl,
                role: req.body.role ?? existingAdmin.role,
            };
            const admin = await  Admin.findByIdAndUpdate(id,updatedAdmin,{new :true}).populate({
                path: 'role',
                populate: {
                    path: 'permissions',
                    model: 'Permission',
                    populate: {
                        path: 'module',
                        model: 'Module',
                    },
                },
            })

            await logAction(
                `updated a admin  titled "${updatedAdmin.name}"`,
                "update",
                req
            );

            this.respondSuccess(res,admin,Messages.updated)
        }catch (error){
            next(error);
        }
    }
    //Delete Admin
    async deleteSuperAdmin (req: Request, res: Response, next: NextFunction){
        try{
            const {id}= req.params;
            const admin : any = await  Admin.findByIdAndDelete(id)
            if (!admin) {
                this.responseNotFound(res,admin,Messages.notFound)
            }
            await logAction(
                `deleted a admin  titled "${admin.name}"`,
                "delete",
                req
            );
            this.respondSuccess(res,admin,Messages.deleted)
        }catch (error){
            next(error);
        }
    }

    // Create Role
    async createRoles(req: Request, res: Response, next: NextFunction){
        try {
            const { name, description, permissions } = req.body;

            const role = new Role({
                name,
                description,
            });

            const createdRole:any = await role.save();

            // Save permissions
            for (const permission of permissions) {
                const newPermission = new Permission({
                    ...permission,
                    role: createdRole._id,
                });

                await newPermission.save();

                // Add permission to role
                createdRole.permissions.push(newPermission._id);
            }

            await createdRole.save();
            await logAction(
                `created a new role titled "${name}"`,
                "create",
                req
            );
            this.respondCreated(res,createdRole,Messages.created)

        } catch (error) {
            next(error);
        }

    }

    // Get All Roles
    async getRoles(req: Request, res: Response, next: NextFunction){
        try {
            const {page ,limit ,offset} = (req as any).pagination;
            const roles = await Role.find().sort({createdAt : -1}).limit(limit).skip(offset).populate(
                {
                    path : "permissions",
                    populate : {
                        path : "module",
                        model : "Module"
                    }
                }
            );
            const totalCounts = await Role.countDocuments();
            const pagination = builderPagination(totalCounts,offset,limit);
            this.respondSuccessWithPaginator(res, roles,pagination,Messages.DATA_LIST);
        } catch (error) {
            next(error);
        }
    }

    // Get a Single Role
    async getRole(req: Request, res: Response, next: NextFunction){
        try {
            const { id } = req.params;
            const role = await Role.findById(id).populate(
                {
                    path : "permissions",
                    populate : {
                        path : "module",
                        model : "Module"
                    }
                }
            );

            if (!role) {
            this.responseNotFound(res,role,Messages.notFound)
            }

            this.respondSuccess(res, role,Messages.getOne);
        } catch (error) {
            next(error);
        }
    }

    // Update Role
    async updateRole(req: Request, res: Response, next: NextFunction){
        try {
            const { name, description, permissions } = req.body;
            const { id } = req.params;
            console.log(id)
            console.log(req.body)


            // Find the role by its ID
            const role : any = await Role.findById(id).populate(
                {
                    path : "permissions",
                    populate : {
                        path : "module",
                        model : "Module"
                    }
                }
            );
            console.log(role)
            if (!role) {
                this.responseNotFound(res,role,Messages.notFound)
            }

            // Update name and description if provided
            role.name = name !== undefined ? name : role.name;
            role.description = description !== undefined ? description : role.description;

            // If permissions are provided
            if (permissions) {
                // 1. Retrieve the current permissions for this role
                const currentPermissions = await Permission.find({ role: id });

                // 2. Loop through the permissions in the request
                for (const permission of permissions) {
                    // 3. Find the permission in the currentPermissions list for the provided module
                    const existingPermission = currentPermissions.find(
                        (p) => p.module.toString() === permission.module
                    );

                    if (existingPermission) {
                        // 4. If the permission for the given module exists, update it with new values
                        existingPermission.read = permission.read !== undefined ? permission.read : existingPermission.read;
                        existingPermission.create = permission.create !== undefined ? permission.create : existingPermission.create;
                        existingPermission.update = permission.update !== undefined ? permission.update : existingPermission.update;
                        existingPermission.delete = permission.delete !== undefined ? permission.delete : existingPermission.delete;

                        await existingPermission.save();
                    } else {
                        // 5. If no permission exists for this module, create a new permission
                        const newPermission = new Permission({
                            ...permission,
                            role: id,
                        });

                        await newPermission.save();
                        role.permissions.push(newPermission._id);
                    }
                }
            }

            // Save the updated role
            await role.save();

            await logAction(
                `updated a role titled "${role.name}"`,
                "update",
                req
            );

            // Return the updated role details
          this.respondSuccess(res, role,Messages.updated)
        } catch (error) {
            next(error);
        }
    }

    // Delete Role
    async deleteRole(req: Request, res: Response, next: NextFunction){
        try {
            const { id } = req.params;

                // Check if any admin is using this role
                const adminsWithRole = await Admin.countDocuments({role: id});
                if (adminsWithRole > 0) {
                   this.responseError(res,{message :Messages.notFound})
                    return;
                }

            const role : any = await Role.findByIdAndDelete(id);
            await logAction(
                `deleted a role titled "${role.name}"`,
                "delete",
                req
            );
                this.respondSuccess(res, role,  Messages.deleted);
        } catch (error) {
            next(error);
        }
    }

    // Create Permission
    async createPermission(req: Request, res: Response, next: NextFunction){
        try {
            const { module, read, create, update, delete: deletePermission } = req.body;

            const newPermission = new Permission({
                module,
                read,
                create,
                update,
                delete: deletePermission,
            });

            await newPermission.save();

            this.respondCreated(res, [newPermission], Messages.created);
        } catch (error) {
            next(error);
        }
    }

    // Get All Permissions
    async getPermissions(req: Request, res: Response, next: NextFunction){
        try {
            const permissions = await Permission.find();
            this.respondSuccess(res, permissions);
        } catch (error) {
            next(error);
        }
    }

    // Get a Single Permission
    async getPermission(req: Request, res: Response, next: NextFunction){
        try {
            const { id } = req.params;
            const permission = await Permission.findById(id);

            if (!permission) {
                 res.status(404).json({ message: "Permission not found" });
            }

            this.respondSuccess(res, permission, Messages.getOne);
        } catch (error) {
            next(error);
        }
    }

    // Update Permission
    async updatePermission(req: Request, res: Response, next: NextFunction){
        try {
            const { id } = req.params;
            const { read, create, update, delete: deletePermission } = req.body;

            const permission : any = await Permission.findById(id);
            if (!permission) {
                 res.status(404).json({ message: "Permission not found" });
            }

            permission.read = read !== undefined ? read : permission.read;
            permission.create = create !== undefined ? create : permission.create;
            permission.update = update !== undefined ? update : permission.update;
            permission.delete = deletePermission !== undefined ? deletePermission : permission.delete;

            await permission.save();

            this.respondSuccess(res, permission);
        } catch (error) {
            next(error);
        }
    }

    // Delete Permission
    async deletePermission(req: Request, res: Response, next: NextFunction){
        try {
            const { id } = req.params;
            const permission = await Permission.findByIdAndDelete(id);

            if (!permission) {
                 res.status(404).json({ message: "Permission not found" });
            }

            this.respondSuccess(res, { message: "Permission deleted successfully" });
        } catch (error) {
            next(error);
        }
    }

    async createModule(req : Request, res: Response, next: NextFunction) {
        try {
            const { name } = req.body;
            const module : any = new Module({ name });
            await module.save();
            this.respondCreated(res, module, Messages.created);
        } catch (error) {
            next(error);
        }
    }


    // Get all modules
    async getModules(req : Request, res : Response, next: NextFunction) {
        try {
            const modules = await Module.find();
            this.respondSuccess(res, modules,Messages.DATA_LIST);
        } catch (error) {
            next(error);
        }
    }

    // Get a single module by ID
    async getModuleById(req : Request, res:Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const module = await Module.findById(id);
            if (!module) {
                this.responseNotFound(res,Messages.notFound)
            }
            this.respondSuccess(res,module,Messages.getOne);
        } catch (error) {
            next(error);
        }
    }

    // Update a module by ID
    async updateModule(req : Request, res : Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { name } = req.body;

            const updatedModule = await Module.findByIdAndUpdate(id, { name }, { new: true });
            if (!updatedModule) {
                this.responseNotFound(res,Messages.notFound)
            }

            this.respondSuccess(res,updatedModule,Messages.updated);
        } catch (error) {
            next(error);
        }
    }

    // Delete a module by ID
    async deleteModule(req : Request, res :Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const deletedModule = await Module.findByIdAndDelete(id);

            if (!deletedModule) {
                this.responseNotFound(res,Messages.notFound)
            }
            this.respondSuccess(res,deletedModule,Messages.deleted);
        } catch (error) {
            next(error);
        }
    }
}

export default AuthController;
