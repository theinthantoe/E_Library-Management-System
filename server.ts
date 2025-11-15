const dotenv = require("dotenv");
dotenv.config();
import App from "./src/app";
const app = new App();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8888;


app.start(PORT);


