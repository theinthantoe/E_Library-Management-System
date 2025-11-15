import Joi from "joi";

const smtpValidator = {
    update : {
        body : Joi.object({
            emailEngine : Joi.string().optional(),
            smtpUsername : Joi.string().optional(),
            smtpPassword : Joi.string().optional(),
            smtpPort : Joi.number().optional(),
            smtpSecurity : Joi.string().optional(),
        })

    }
}

export default smtpValidator;