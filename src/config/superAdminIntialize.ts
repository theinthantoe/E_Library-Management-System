import mongoose from "mongoose";
import Permission, {IPermission} from "../models/Permission";
import {Role} from "../models/Role";
import {Admin} from "../models/Admin";
import {Module} from "../models/Module";
import { hashPassword } from "../helpers/auth";

const initializeSuperAdmin = async () => {
    try {
        console.log("Starting seeding process...");
        // Step 1: Define module names
        const moduleNames = ["eBooks", "Reporting", "Administration"];

        // Step 2: Seed modules
        const modules = await Promise.all(
            moduleNames.map(async (name) => {
                let module = await Module.findOne({ name });
                if (!module) {
                    module = await Module.create({ name });
                }
                return module;
            })
        );

        // Step 3: Seed SuperAdmin role
        let superAdminRole = await Role.findOne({ name: "Super Admin" });
        if (!superAdminRole) {
            superAdminRole = await Role.create({
                name: "Super Admin",
                description: "SuperAdmin role with full permissions",
            });
        }

        // Step 4: Seed permissions
        const permissions : any = await Promise.all(
            modules.map(async (module) => {
                let permission = await Permission.findOne({ module: module._id });
                if (!permission) {
                    permission = await Permission.create({
                        module: module._id,
                        read: true,
                        create: true,
                        update: true,
                        delete: true,
                        role: superAdminRole._id,
                    });
                }
                return permission;
            })
        );

        // Step 5: Link permissions to SuperAdmin role
        superAdminRole.permissions = permissions.map((perm : IPermission) => perm._id);
        await superAdminRole.save();

        // Step 6: Seed SuperAdmin user
        const superAdminEmail = "superadmin@example.com";
        let superAdmin = await Admin.findOne({ email: superAdminEmail });
        if (!superAdmin) {
            const hashedPassword = await hashPassword("SuperAdmin123!");
            superAdmin = await Admin.create({
                name: "Super Admin",
                profile: "https://via.placeholder.com/150",
                email: superAdminEmail,
                phone_number: "1234567890",
                password: hashedPassword,
                role: superAdminRole._id,
            });
        }

        console.log("Seeding process completed.");
    } catch (error) {
        console.error("Error during seeding:", error);
    }
};

export default initializeSuperAdmin;
