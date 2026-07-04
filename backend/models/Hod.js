import mongoose from "mongoose";

const hodSchema = new mongoose.Schema({
  userid: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {   // ✅ HOD name
    type: String,
    required: true,
  },
  department: {  // ✅ Department (optional if you want selection)
    type: String,
    required: true,
  }
}, { timestamps: true });

const Hod = mongoose.model("Hod", hodSchema);

export default Hod;
