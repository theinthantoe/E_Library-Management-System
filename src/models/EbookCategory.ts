import mongoose from "mongoose";
const categorySchema = new mongoose.Schema({
    name : {
        type: String, required: true,unique : true
    }
}, { timestamps: true });
const EbookCategory = mongoose.model("EbookCategory", categorySchema);
export {EbookCategory}