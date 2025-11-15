import Joi from "joi";

const categoryValidation = {
    //create category
    createCategory : {
        body : Joi.object({
            name : Joi.string().required(),
        })
    },
    //update category
    updateCategory : {
        body : Joi.object({
            name: Joi.string().required(),
        })
    },
    //validate id
    validateCategoryId :{
        params : Joi.object({
            id : Joi.string().required(),
            moduleId : Joi.string().required(),
        })
    },
    //delete id
    deleteCategoryId : {
        params : Joi.object({
            id : Joi.string().required(),
            moduleId : Joi.string().required(),
        })
    }
}
export  default  categoryValidation