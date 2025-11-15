import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    organization : {
        type: String,
        required: true,
    },
    phone_number: {
        type : String,
        required: true,
    },
    name  : {
        type: String,
        required: true,
    },
    email : {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    status: {type : String, enum  : ['active','expired'],default: 'active'},
    license_key : {
        type: String,
        required: true,
    },
    mongo_Url : {
        type: String,
        required: true,
    },
    packageId: {
        type  : mongoose.Schema.Types.ObjectId, ref : "Package", required :true
    },
    userLimit : {
        type: Number,
        required: true,
    },
    remainUser : {
        type: Number,
        default: 0,
    },
    expirationDate: {
        type: Date, // Calculated expiration date
        required: false,
    },
})
const Customer = mongoose.model("Customer", customerSchema);
export { Customer };