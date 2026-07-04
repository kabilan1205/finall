import mongoose from "mongoose";
const LeaveSchema = new mongoose.Schema({
  userid: { type: String, required: true },
  name: { type: String, required: true },
  reason: { type: String, required: true },
  date: { type: Date, required: true },
  department: { type: String },
  class: { type: String },
  studentRegNo: { type: String },

  // 🔹 New status fields
  advisorStatus: { type: String, default: "Pending" },  // Approved / Rejected / Pending
  hodStatus: { type: String, default: "Pending" },      // Approved / Rejected / Pending
  finalStatus: { type: String, default: "Pending" },    // Approved / Rejected / Pending
}, { timestamps: true });

export default mongoose.model("Leave", LeaveSchema);
