import mongoose from "mongoose";

const eBookSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    publish_year: { type: Number, required: true },
    number_of_pages: { type: Number, default: 0 },
    description: { type: String, default: '' },
    cover_photo: { type: String, default: '' },
    book_pdf: { type: String, default: '' },
    type: { type: String, default: '' },
    rating: { type: Number, default: 0.0 },
    currentPage: { type: Number, default: 0 },
    view_count: { type: Number, default: 0 },
    ebookCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'EbookCategory' },
    ebookLevel: { type: mongoose.Schema.Types.ObjectId, ref: 'EbookLevel' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
    ratings: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            score: { type: Number, required: true, min: 1, max: 5 },
        },
    ],
    progress: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            readPages: { type: Number, default: 0 },
            percentageProgress: { type: Number, default: 0 },
            lastReadAt: { type: Date, default: Date.now },
            hasCountedView: { type: Boolean, default: false },
        }
    ],
    percentageProgress: { type: Number, default: 0 }
}, { timestamps: true });

// Register the model as 'EBook'
const EBook = mongoose.model('EBook', eBookSchema);
export { EBook };
