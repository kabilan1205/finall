import mongoose from "mongoose";

const advisorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userid: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: Number, required: true },
  class: { type: String, required: true },
  subjects: [{ type: String, required: true }] // ✅ New field for handled subjectsmmm
});

const Advisor = mongoose.model("Advisor", advisorSchema);
export default Advisor;
