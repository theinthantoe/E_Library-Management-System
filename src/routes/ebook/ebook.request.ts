import Joi from 'joi';

const ebookValidator = {
    // Create Ebook Validation
    createEbook: {
        body: Joi.object({
            title: Joi.string().required(),
            publish_year: Joi.number().integer(),
            number_of_pages: Joi.number().integer().min(1).required(),
            description: Joi.string().optional(),
            type: Joi.string().valid('myanmar', 'english').required(),
            author: Joi.string().required(),
            ebookCategory: Joi.string().required(),
            ebookLevel: Joi.string().required()
        }),
    },

    // Update Ebook Validation
    updateEbook: {
        body: Joi.object({
            title: Joi.string().optional(),
            publish_year: Joi.number().optional(),
            number_of_pages: Joi.number().integer().optional(),
            description: Joi.string().allow("").optional(),
            type: Joi.string().valid('myanmar', 'english').optional(),
            author: Joi.string().optional(),
            ebookCategory: Joi.string().optional(),
            ebookLevel: Joi.string().optional()
        }),
    },

    // Get Ebook Validation (for ID)
    validateEbookId: {
        params: Joi.object({
            id: Joi.string().hex().length(24).required(), // MongoDB ObjectId pattern
            moduleId : Joi.string().hex().length(24).required(),
        }),
    },

    // // Get All Ebooks Validation (pagination)
    // getAllEbooks: {
    //     query: Joi.object({
    //         page: Joi.number().integer().min(1).optional(),
    //         limit: Joi.number().integer().min(1).optional(),
    //         search: Joi.string().optional(),
    //     }),
    // },

    // Delete Ebook Validation (for ID)
    deleteEbook: {
        params: Joi.object({
            id: Joi.string().hex().length(24).required(), // MongoDB ObjectId pattern
            moduleId : Joi.string().hex().length(24).required(),
        }),
    },
};

export default ebookValidator;
