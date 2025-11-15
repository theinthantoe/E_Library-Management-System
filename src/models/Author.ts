import mongoose from "mongoose";

const authorSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
    eBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EBook' }]
}, { timestamps: true });

const Author = mongoose.model("Author", authorSchema);
export { Author };
