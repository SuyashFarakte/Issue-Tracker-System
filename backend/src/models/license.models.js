import mongoose, { Schema } from "mongoose";

const licenseSchema = new Schema(
    {
        fileName: {
            type: String,
            required: true,
            trim: true
        },
        fileData: {
            type: Buffer,
            required: true
        },
        fileType: {
            type: String,
            required: true,
            enum: ['application/pdf', 'image/png'],
            trim: true
        },
        expiryDate: {
            type: Date,
            required: true,
            index: true
        },
        department: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        notificationSent: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: String
        },
        updatedAt: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

// Index for efficient querying of expiring licenses
licenseSchema.index({ expiryDate: 1, department: 1 });

export const License = mongoose.model("License", licenseSchema);
