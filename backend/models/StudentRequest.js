import mongoose from "mongoose";

const studentRequestSchema = new mongoose.Schema({
  regNo: String,
  name: String,
  department: String,
  reason: String,
  date: String,
  status: { type: String, default: "Pending" },
  advisorApproved: { type: Boolean, default: false },
  hodApproved: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("StudentRequest", studentRequestSchema);
