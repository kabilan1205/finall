// models/studentLoginModels.js
import mongoose from 'mongoose';

const studentLoginSchema = new mongoose.Schema({
  userid: { type: String, required: true, unique: true },
  password: { type: String, required: true },

});

const Student = mongoose.model('Student', studentLoginSchema);
export default Student;
