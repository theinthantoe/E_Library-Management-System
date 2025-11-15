import { Request, Response } from "express";
import { Schema } from "joi";
import { StatusCodes } from 'http-status-codes';

interface Paginator {
    totalItems?: number;
    currentPage?: number;
    totalPages?: number;
    pageSize?: number;
}

interface SuccessOptions {
    statusCode?: number;
}

interface ErrorOptions {
    statusCode?: number;
}

class BaseController {
    validateRequest(req: Request, schema: Schema): void {
        const options = {
            abortEarly: false,
            allowUnknown: true,
        };
        const { error } = schema.validate(req.body, options);
        if (error) {
            const validationErrors = error.details.map((detail) => detail.message);
            throw {
                status: "error",
                errorCode: StatusCodes.UNPROCESSABLE_ENTITY,
                message: "Validation Error",
                errors: validationErrors,
            };
        }
    }

    respondSuccessWithPaginator(
        res: Response,
        data: any[] = [],
        paginator: Paginator = {},
        message: string = "",
        { statusCode = StatusCodes.OK }: SuccessOptions = {}
    ): Response {
        const response = {
            success: true,
            paginator,
            data,
            message,
        };
        return res.status(statusCode).json(response);
    }

    respondSuccess(
        res: Response,
        data: any,
        message: string = "",
        { statusCode = StatusCodes.OK }: SuccessOptions = {}
    ): Response {
        const response = {
            success: true,
            data,
            message,
        };
        return res.status(statusCode).json(response);
    }

    respondCreated(
        res: Response,
        data: any[] = [],
        message: string = ""
    ): Response {
        const response = {
            success: true,
            data,
            message,
        };
        return res.status(StatusCodes.CREATED).json(response);
    }

    respondBulkUploadCreated(
        res: Response,
        data: any = { },
        message: string = ""
    ): Response {
        const response = {
            success: true,
            data,
            message,
        };
        return res.status(StatusCodes.CREATED).json(response);
    }

    responseError(
        res: Response,
        message: any = "",
        error: string = "Error",
        { statusCode = StatusCodes.BAD_REQUEST }: ErrorOptions = {}
    ): Response {
        const response = {
            success: false,
            message,
            error,
        };
        return res.status(statusCode).json(response);
    }

    responseNotFound(
        res: Response,
        message: any =" ",
        error: string = "Not Found",
        { statusCode = StatusCodes.NOT_FOUND }: ErrorOptions = {}
    ): Response {
        const response = {
            success: false,
            message,
            error,
        };
        return res.status(statusCode).json(response);
    }
    responseBadRequest(
        res: Response,
        message: any = "",
        error: string = "Bad Request",
        { statusCode = StatusCodes.BAD_REQUEST }: ErrorOptions = {}
    ): Response {
        const response = {
            success: false,
            message,
            error,
        };
        return res.status(statusCode).json(response);
    }
}

export default BaseController;
