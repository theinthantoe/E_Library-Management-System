import mongoose from "mongoose";

const packageSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
        unique: true,
    },
    duration : {
        type: Number,
        required: true,},
    data : {
        type : [String],
        default : [],
    }
    ,
    description: {
        type: [String], // Array of descriptions
        default: [], // e.g., ['Includes 1000 eBooks', '500 audiobooks']
    },
}, { timestamps: true });

const Package = mongoose.model("Package", packageSchema);
export { Package };
