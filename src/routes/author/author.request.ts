import Joi from 'joi';

const authorValidator = {
    //create author
    createAuthor : {
        body : Joi.object({
            name: Joi.string().required(),
            image : Joi.string().optional(),
            description : Joi.string().optional(),
        })
    },
    //update author
    updateAuthor : {
        body : Joi.object({
            name: Joi.string().optional(),
            image : Joi.string().optional(),
            description : Joi.string().optional(),
        })
    },
    //validate Id
    validateId : {
        params: Joi.object({
            id : Joi.string().required(),
            moduleId : Joi.string().required(),
        })
    }

}
export default authorValidator;