import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema({
  name: String,
  userid: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  regno: String,
  class: String
});

export default mongoose.model("2ITStudent", StudentSchema);
