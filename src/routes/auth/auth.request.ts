import Joi from "joi";

const authValidator = {
    // Super Admin Create
    createSuperAdmin: {
        body: Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone_number: Joi.string().required(),
            photo: Joi.string().optional(),
            password: Joi.string().required(),
            role: Joi.string().required(),
        }),
    },

    // Role Validation
    createRole: {
        body: Joi.object({
            name: Joi.string().required(),
            description: Joi.string().required(),
            permissions: Joi.array()
                .items(
                    Joi.object({
                        module: Joi.string().required(),
                        read: Joi.boolean().default(false),
                        create: Joi.boolean().default(false),
                        update: Joi.boolean().default(false),
                        delete: Joi.boolean().default(false),
                    })
                )
                .optional(), // Permissions are optional, but if provided, they should be valid
        }),
    },

    updateRole: {
        body: Joi.object({
            name: Joi.string().optional(),
            description: Joi.string().optional(),
            permissions: Joi.array()
                .items(
                    Joi.object({
                        module: Joi.string().optional(),
                        read: Joi.boolean().optional(),
                        create: Joi.boolean().optional(),
                        update: Joi.boolean().optional(),
                        delete: Joi.boolean().optional(),
                    })
                )
                .optional(), // Permissions are optional, but if provided, they should be valid
        }),
    },

    // Permission Validation
    createPermission: {
        body: Joi.object({
            module: Joi.string().required(),
            read: Joi.boolean().default(false),
            create: Joi.boolean().default(false),
            update: Joi.boolean().default(false),
            delete: Joi.boolean().default(false),
        }),
    },

    updatePermission: {
        body: Joi.object({
            module: Joi.string().optional(),
            read: Joi.boolean().optional(),
            create: Joi.boolean().optional(),
            update: Joi.boolean().optional(),
            delete: Joi.boolean().optional(),
        }),
    },

    // Validation for ID Parameter (for get and delete)
    validateId: {
        params: Joi.object({
            id: Joi.string().hex().length(24).required(), // MongoDB ObjectId pattern
            moduleId: Joi.string().hex().length(24).optional(),
        }),
    },

    // Validation for Get All (pagination etc.)
    getAll: {
        query: Joi.object({
            page: Joi.number().integer().min(1).optional(),
            limit: Joi.number().integer().min(1).optional(),
            search: Joi.string().optional(),
        }),
    },
    createModule : {
        body: Joi.object({
            name : Joi.string( ).required(),
        })
    },
    updateModule : {
        body : Joi.object({
            name : Joi.string( ).optional(),
        })
    }
};

export default authValidator;
