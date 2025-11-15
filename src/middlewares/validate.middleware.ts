import { Request, Response, NextFunction } from "express";
import { Schema, ValidationOptions } from "joi";
import ValidationError from "../helpers/validation-error";

type SchemaType = {
    body?: Schema;
    query?: Schema;
    params?: Schema;
};

const validate = (schema: SchemaType, joiOptions: ValidationOptions = {}) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const types: (keyof SchemaType)[] = ["body", "query", "params"];
        let errorDetails: any[] = [];

        types.forEach((type) => {
            if (!schema[type]) return;
            const result = schema[type]!.validate(req[type], joiOptions); // Non-null assertion
            if (
                result.error &&
                result.error.details &&
                result.error.details.length > 0
            ) {
                errorDetails = errorDetails.concat(result.error.details || []);
            }
            req[type] = result.value;
        });

        if (errorDetails.length > 0) {
            errorDetails = errorDetails.map((detail) => {
                detail.message = detail.message.split(`"`).join(`'`);
                return detail;
            });
            throw new ValidationError(errorDetails);
        }

        next();
    };
};

export default validate;
