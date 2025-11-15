import mongoose from "mongoose";
const levelSchema = new mongoose.Schema({
    name : { type: String, required: true },
},{timestamps : true})
const EbookLevel = mongoose.model("EbookLevel", levelSchema);
export { EbookLevel };