import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  userid: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  rollno: { type: String, required: true },
  regno: { type: String, required: true },
  class: { type: String, required: true },
  photo: {
    type: String, // We'll store the **image URL** or **Base64 data**
    default: ""   // Initially empty
  }
});

export default mongoose.model("Student", studentSchema);
