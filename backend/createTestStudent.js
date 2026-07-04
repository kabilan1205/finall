import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Student from "./models/Student.js"; // your student model

mongoose.connect("mongodb://127.0.0.1:27017/yourDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  // 1️⃣ Hash the password
  const hashedPassword = await bcrypt.hash("student123", 10); 
  // "student123" is the plain text password you want for login
  // 10 = number of salt rounds for security

  // 2️⃣ Create student document
  const student = new Student({
    userid: "stu001",   // the user ID for login
    password: hashedPassword,  // store hashed password
    name: "Mathan",
    class: "5A"
  });

  // 3️⃣ Save in MongoDB
  await student.save();
  console.log("✅ Test student created!");

  process.exit(); // close script
})
.catch(err => console.error(err));
