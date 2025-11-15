import Joi from 'joi';

const customerValidator = {
    createCustomer : {
        body : Joi.object({
            name: Joi.string().required(),
            organization: Joi.string().required(),
            phone_number : Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().required(),
            packageId : Joi.string().required(),
            mongo_Url : Joi.string().required(),
            userLimit : Joi.number().required(),
            remainUser : Joi.number().required(),
        })
    },
    updateCustomer : {

            body : Joi.object({
                name: Joi.string().optional(),
                organization: Joi.string().optional(),
                phone_number : Joi.string().optional(),
                email: Joi.string().email().optional(),
                password: Joi.string().optional(),
                packageId : Joi.string().optional(),
                userLimit : Joi.number().optional(),
                remainUser : Joi.number().optional(),
            })

    },
    validateId : {
        params : Joi.object({
            id : Joi.string().required(),
            moduleId : Joi.string().required(),
        })
    }

}
export default  customerValidator