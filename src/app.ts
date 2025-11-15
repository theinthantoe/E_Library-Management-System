import express,{Express} from "express";
import dotenv from "dotenv";
import  helmet from "helmet";
const  morgan = require("morgan");
import { StatusCodes } from 'http-status-codes';

import connectDB from './config/db'
import ApiError from "./helpers/api-error";
import ValidationError from "./helpers/validation-error";
import {Server} from "http";
const cors = require('cors');
dotenv.config();
import Routes from "./routes";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../src/utils/swaggerConfig";
import  cron from "node-cron"
import {deleteOldLogs} from "./utils/cronJob";


class App {
    private app: Express;

    constructor() {
        this.app = express();
        this.setup();
        this.connectDB();
        this.setupCronJobs();

    }

    private setup() {



        this.app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));

        this.app.use(morgan(":date[clf] :method :url :status :response-time ms"));

        const corsOptions = {
            origin: [

                "http://localhost:3000",     // Local development (React)
                "http://mlibrary-b.origin.com.mm",
                "https://mlibrary-b.origin.com.mm",
               "https://mlibrary-admin.origin.com.mm",
                "http://mlibrary-admin.origin.com.mm",
                "https://elibrary-admin.origin.com.mm",
                "http://elibrary-admin.origin.com.mm",
                "http://elibrary-admin.origin.com.mm/api",
                "https://elibrary-admin.origin.com.mm/api",
                "https://mlibrary-admin.origin.com.mm/api",
                "http://mlibrary-admin.origin.com.mm/api",
                "http://elibrary-demo.origin.com.mm",
                "https://elibrary-demo.origin.com.mm",
                "http://elibrary-demo.origin.com.mm/api",
                "https://elibrary-demo.origin.com.mm/api",
                "http://elibrary-b.origin.com.mm",
                "https://elibrary-b.origin.com.mm",
                "https://elibrary.obs.com.mm",
                "http://elibrary.obs.com.mm"

            ],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,   // Ensure credentials (cookies) are allowed
        };

        this.app.use(cors(corsOptions));

        // Handle pre-flight (OPTIONS) requests globally
        this.app.options('*', cors(corsOptions))

        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
        this.setupRoutes();
        // Serve Swagger API docs
        this.app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));



        this.app.use((err: any, req: any, res: any, next: any) => {
            // Handle validation errors
            if (err instanceof ValidationError) {
                const errors = err.details.map((detail: any) => detail.message);
                const error = new ApiError(
                    errors[0],
                    StatusCodes.UNPROCESSABLE_ENTITY,
                    true,
                    { errors }
                );
                return next(error);
            }


            // Handle other errors
            if (!(err instanceof ApiError)) {
                const apiError = new ApiError(
                    err.message,
                    err.status || StatusCodes.INTERNAL_SERVER_ERROR,
                    err.isPublic,
                    {
                        stack: err.stack,
                    }
                );
                return next(apiError);
            }

            return next(err);
        });

        // Handle 404 and forward to error handler
        this.app.use((req: any, res: any, next: any) => {
            const err = new ApiError("API not found", StatusCodes.NOT_FOUND);
            return next(err);
        });

        // Error handler, send stacktrace only during development
        this.app.use((err: ApiError, req: any, res: any, next: any) => {
            console.error("Error Handler:", err);
            const errMessage = err.message || "Internal Server Error";
            res.status(err.status || StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: "error",
                errorCode: err.errorCode || StatusCodes.INTERNAL_SERVER_ERROR,
                message: errMessage,
                errors: err.errors || [errMessage],
            });
        });
    }

    async connectDB(){
        await connectDB();
    }

    private setupCronJobs() {
        cron.schedule("0 0 * * *", async () => {
            console.log("Running cron job to delete old logs...");
            await deleteOldLogs();
        });
    }

    private setupRoutes() {
        new Routes(this.app);
    }

    public start(port: number) {
        let server : Server = this.app.listen(port, () => {
            console.log(`Server is running on port ${port}`);

        });
    }
}

export default App;