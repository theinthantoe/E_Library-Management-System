import { Request, Response, NextFunction } from "express";
const jwt = require('jsonwebtoken');
import dotenv from "dotenv";
import {AdminLog} from "../models/AdminLog";
import  {ActionLog} from "../models/ActionLog";
import Permission,{IPermission} from "../models/Permission";
import  {Module} from "../models/Module";
import {Admin} from "../interface/auth";

dotenv.config();
type actionType = 'create' | 'read' | 'update' | 'delete'
export const permissionMiddleware = (action: actionType) : (req: Request, res: Response, next: NextFunction) => Promise<void> => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = (req as any).user;
            const { moduleId } = req.params;

            if (!moduleId) {
                res.status(400).json({ message: "Required module ID" });
                return;
            }

            const module: any = await Module.findById(moduleId);
            const moduleName = module.name;

            // Ensure permissions is typed as an array of IPermission objects
            const permissions: IPermission[] = await Permission.find({
                role: user.role._id,
            }).populate('module');

            // Find the permission that matches the requested action
            const permission = permissions.find(permission =>
                permission.module._id.toString() === moduleId && permission[action] === true
            );

            // If permission is not found, return a 403 Forbidden response
            if (!permission) {
                res.status(403).json({
                    message: `Access denied! You do not have '${action}' permission for the '${moduleName}' module.`,
                });
                return;
            }

            // Proceed to the next middleware or route handler if permission is granted
            next();
        } catch (error) {
            next(error); // Pass the error to the next handler
        }
    };
};

// Generate a token for authentication
export const generateToken = (data: any): string => {
    // Avoid including sensitive information like password in the token payload
    const { password, ...safeData } = data;
    return jwt.sign({ data: safeData }, process.env.TOKEN_SECRET_KEY as string, {
        expiresIn: "24h", // Add an expiration time for security
    });
};

// Middleware to verify authentication
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ message: "Authentication failed! No token provided" });
            return
        }

        const token = authHeader.split(" ")[1]; // Bearer <token>
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET_KEY as string);

        // Attach the user data from the token to the request object
        (req as any).user = (decodedToken as any).data;
        next();
    } catch (error: any) {
         res.status(401).json({ message: "Authentication failed!", error: error.message });
         return;
    }
};

//Check Ip

const getIpAddress = (req : any)=>{
    let ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    if(ipAddress){
        if(ipAddress.includes(",")){
            ipAddress = ipAddress.split(',')[0].trim();
        }
        if (ipAddress.includes("::ffff:")) {
            ipAddress = ipAddress.split(":").pop();
        }
    }
    return ipAddress;
}

//Function to pase user-agent and browser info
const parseUserAgent =(userAgent : any)=>{
    if (!userAgent) {
        return {
            browser: "Unknown",
            platform: "Unknown",
        };
    }
    // Extract browser and version
    let browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)\/?\s*(\d+)/i);
    let browserName = browserMatch ? browserMatch[1] : "Unknown";
    let browserVersion = browserMatch ? browserMatch[2] : "Unknown";

    // Handle Internet Explorer (older versions)
    if (browserName === "MSIE" || /Trident/i.test(userAgent)) {
        browserName = "Internet Explorer";
        browserVersion = userAgent.match(/rv:(\d+)/i) ? userAgent.match(/rv:(\d+)/i)[1] : "Unknown";
    }

    // Extract Operating System (platform)
    let osMatch = userAgent.match(/\(([^)]+)\)/);
    let operatingSystem = osMatch ? osMatch[1].split(";")[0] : "Unknown";

    return {
        browser: `${browserName} ${browserVersion}`,  // Full browser string like "Chrome 131"
        platform: operatingSystem,  // Platform (OS) like "Macintosh"
    };
}

export const AdminLogAction = async (existingAdmin :Admin, req: Request): Promise<void> => {
    try {
        // Get IP and User-Agent using the helper functions
        const ipAddress = getIpAddress(req);
        const { browser, platform } = parseUserAgent(req.headers['user-agent']);

        console.log(ipAddress);

        // Log the details in the AdminLog
        await AdminLog.create({
            user: existingAdmin.email,
            role: existingAdmin.role.name,
            ipAddress,
            browser,
        });
    } catch (error) {
        console.error("Error logging admin action:", error);
    }
}

export const logAction = async (message: string, action: string, req: Request) => {
    try {
        // Type assertion to tell TypeScript that req.user exists and is of type User
        const user = (req as any).user;  // Replace `any` with your specific user type if needed

        // Ensure user is defined before proceeding
        if (!user) {
            console.error("No user found in request for logging action.");
            return;
        }

        const ipAddress = getIpAddress(req);  // Assuming getIpAddress function is defined elsewhere
        const { platform, browser } = parseUserAgent(req.headers['user-agent']);  // Assuming parseUserAgent is defined elsewhere

        const log = new ActionLog({
            message: ` ${user.name} ${message}`,
            action,
            email: user.email,  // Using `user.email` here instead of req.user.email
            ipAddress,
            platform: browser,  // Log the browser
            agent: platform,  // Log the operating system
            dateTime: new Date(),  // Current date/time
        });

        await log.save();  // Save the log to the database
    } catch (error) {
        console.error("Error logging action:", error);
    }
};

