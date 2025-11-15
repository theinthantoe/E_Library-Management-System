import { StatusCodes } from 'http-status-codes';

/**
 * Custom ValidationError class extending the base Error class.
 * @extends Error
 */
class ValidationError extends Error {
    status: number;
    errorCode: string;
    errors: any[];
    details: any[];

    /**
     * @param {any[]} details - The detailed error messages from Joi validation.
     * @param {Object} [options={}] - Optional custom fields.
     * @param {any[]} [options.errors=[]] - Array of custom errors.
     * @param {string} [options.errorCode=null] - Custom error code.
     */
    constructor(

        details: any[] = [],
        {
            errors = [],
            errorCode = null,
        }: { errors?: any[]; errorCode?: string | null } = {}
    ) {
        // The message is typically the first validation error message from Joi
        const message = details[0]?.message || 'Validation error';

        // Call the parent class constructor
        super(message);

        // Set the custom properties
        this.name = this.constructor.name;
        this.status = StatusCodes.UNPROCESSABLE_ENTITY;  // 422 status for validation errors
        this.errorCode = errorCode || String(StatusCodes.UNPROCESSABLE_ENTITY);  // Default to 422 if no custom error code is provided
        this.errors = errors;
        this.details = details;

        // Capture the stack trace for better error debugging
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ValidationError;
