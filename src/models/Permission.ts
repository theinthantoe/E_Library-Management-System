import mongoose, { Document, Schema } from 'mongoose';

// Define the IPermission interface that represents a Permission document
export interface IPermission extends Document {
    module: mongoose.Types.ObjectId; // Or specific type if needed
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    role : mongoose.Types.ObjectId
}

const PermissionSchema = new Schema<IPermission>({
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
});

const Permission = mongoose.model<IPermission>('Permission', PermissionSchema);
export default Permission;
