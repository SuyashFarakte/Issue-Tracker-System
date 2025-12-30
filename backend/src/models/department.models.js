import mongoose, { Schema } from "mongoose";

const departmentSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: ["Maintenance", "Regular"],
            default: "Regular",
        },
    },
    {
        timestamps: true,
    }
);

export const Department = mongoose.model("Department", departmentSchema);
