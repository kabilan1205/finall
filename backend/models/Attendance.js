import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  regno: { type: String, required: true },
  name: String,
  rollno: String,
  status: String,
  approved: Boolean,
  date: String,        // YYYY-MM-DD
  class: String,
  advisorUserid: String,
  reason: String
}, { timestamps: true });

attendanceSchema.index({ regno: 1, date: 1 }, { unique: true });
attendanceSchema.index({ advisorUserid: 1, date: 1 });
attendanceSchema.index({ class: 1, date: 1 });

export default mongoose.model("Attendance", attendanceSchema);
