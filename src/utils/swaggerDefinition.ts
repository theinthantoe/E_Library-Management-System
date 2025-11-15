import {OpenAPIV3} from "openapi-types"

const swaggerApiDefinition : OpenAPIV3.Document = {
    openapi: "3.0.0",
    info: {
        title: "API Documentation",
        version: "1.0.0",
        description: "API documentation for the ELibrary Main Portal project",
    },
    servers: [
        {
            url: "http://localhost:8090/api", // Update with your API base URL
            description: "Development server",
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
    paths: {}, // Paths will be added dynamically
};

export default swaggerApiDefinition
