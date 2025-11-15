import mongoose from "mongoose";
const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    permissions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Permission",
        },
    ],
});

const Role = mongoose.model("Role", RoleSchema);

export { Role };