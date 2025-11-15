import mongoose from "mongoose";
import dotenv from "dotenv";
import intitializeData from "./superAdminIntialize"
import initializeSmtpData from "./smtpSeeder";
// Load environment variables
dotenv.config();

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("MongoDB connection string is not defined in .env ");
    }

    try {
        await mongoose.connect(uri);
        await intitializeData()
        await initializeSmtpData()
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    }
};

export default connectDB;
