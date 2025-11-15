import mongoose from "mongoose";
const AdminLogSchema = new mongoose.Schema({
    user: { type: String},
    role :{type: String},
    ipAddress: { type: String },
    browser: { type: String },
    logTime: { type: Date, default: Date.now },
});

const AdminLog = mongoose.model("AdminLog", AdminLogSchema);
export { AdminLog };