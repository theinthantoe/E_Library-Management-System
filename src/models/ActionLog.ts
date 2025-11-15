import mongoose from "mongoose";

const ActionLogSchema = new mongoose.Schema({
    message: { type: String, required: true },
    email: { type: String, required: true }, // Email of the user performing the action
    ipAddress: { type: String, required: true }, // IP address of the user
    action: { type: String, required: true }, // Action performed, e.g., "create_ebook"
    platform: { type: String }, // e.g., "Windows", "MacOS", "Linux"
    agent: { type: String }, // Browser or client information
    logTime: { type: Date, default: Date.now }, // Timestamp of the action
});

const ActionLog = mongoose.model("ActionLog", ActionLogSchema);

export { ActionLog };
