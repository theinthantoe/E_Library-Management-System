import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
        name: { type: String, required: true },
        photo: { type: String ,default : ""},
        email: { type: String, required: true, unique: true },
        phone_number: { type: String, required: true },
        password: { type: String, required: true },
        role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    },
    {
        timestamps: true
    })

const Admin = mongoose.model('Admin',adminSchema)

export {Admin}