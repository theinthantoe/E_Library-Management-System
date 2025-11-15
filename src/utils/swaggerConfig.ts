import swaggerJsdoc from "swagger-jsdoc";
import swaggerDefinition from "./swaggerDefinition";

const options: swaggerJsdoc.Options = {
    definition: swaggerDefinition,
    apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts"], // Path to your route files
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
