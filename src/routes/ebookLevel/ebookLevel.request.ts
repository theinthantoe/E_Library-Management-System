import Joi from "joi";  // Correct import style

const ebookLevelValidator = {
    // Create Ebook Level
    createEbookLevel: {
        body: Joi.object({
            name: Joi.string().required(),
        })
    },

    // Update Ebook Level
    updateEbookLevel: {
        body: Joi.object({
            name: Joi.string().optional(),  // Allow 'name' to be optional
        })
    },

    // Validate Ebook Level Id
    validateEbookLevelId: {
        params: Joi.object({
            id: Joi.string().hex().length(24).required(), // MongoDB ObjectId pattern
            moduleId : Joi.string().hex().length(24).required(),
        }),
    },

    // Delete Ebook Level
    deleteEbookLevel: {
        params: Joi.object({
            id: Joi.string().hex().length(24).required(), // MongoDB ObjectId pattern
            moduleId : Joi.string().hex().length(24).required(),
        }),
    },
}

export default ebookLevelValidator;
