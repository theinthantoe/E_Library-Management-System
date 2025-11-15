import Joi from "joi";

const packageValidatior = {
    //create package
    createPackage : {
        body : Joi.object({
            name: Joi.string().required(),
            duration : Joi.number().required(),
            data : Joi.array().items(Joi.string()).optional(),
            description: Joi.array().items(Joi.string()).optional(),
        })
    },
    updatePackage: {
        body: Joi.object({
            name: Joi.string().required(),
            duration : Joi.number().required(),
            data : Joi.array().items(Joi.string()).optional(),
            description: Joi.array().items(Joi.string()).optional(),
        }),
    },
    validateId: {
        params: Joi.object({
            id: Joi.string().hex().length(24).required(),
            moduleId : Joi.string().hex().length(24).required(),
        }),
    },
}
export default  packageValidatior