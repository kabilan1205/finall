import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Student from "../models/Student.js";
import StudentRequest from "../models/StudentRequest.js";

const router = express.Router();
// ✅ Student Login API
router.post("/login", async (req, res) => {
  try {
    const { userid, password } = req.body;

    // Find student by userid
    const student = await Student.findOne({ userid });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Password check
    if (student.password !== password) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // ✅ Send back THIS student's data
    res.json({
      success: true,
      message: "Login successful",
      student: {
        userid: student.userid,
        name: student.name,
        rollno: student.rollno,
        regno: student.regno,
        department: student.department,
        class: student.class,
        photo: student.photo || null
      }
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ===============================
// 🔹 SUBMIT LEAVE REQUEST
// ===============================
router.post("/request", async (req, res) => {
  try {
    const { regNo, name, department, reason, date } = req.body;

    const newRequest = new StudentRequest({
      regNo,
      name,
      department,
      reason,
      date,
    });

    await newRequest.save();
    res.status(201).json({ success: true, message: "Leave request submitted successfully" });
  } catch (error) {
    console.error("❌ Submit Request Error:", error);
    res.status(500).json({ success: false, message: "Failed to submit request" });
  }
});

// ===============================
// 🔹 GET LEAVE STATUS BY REGNO
// ===============================
router.get("/status/:regNo", async (req, res) => {
  try {
    const regNo = req.params.regNo;
    const requests = await StudentRequest.find({ regNo });

    if (!requests.length) {
      return res.status(404).json({ success: false, message: "No requests found" });
    }

    res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("❌ Fetch Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch status" });
  }
});

// ===============================
// 🔹 FETCH ALL STUDENTS
// ✅ Fetch student profile by userid
router.get("/profile/:userid", async (req, res) => {
  try {
    const student = await Student.findOne({ userid: req.params.userid });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, student });
  } catch (err) {
    console.error("❌ Fetch Profile Error:", err);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});


// ===============================
// 🔹 CONFIGURE MULTER FOR IMAGE UPLOADS
// ===============================
const uploadPath = path.join("uploads", "students");

// ✅ Auto-create folder if missing
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log("📂 Created uploads/students directory");
}

// ✅ Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ===============================
// 🔹 UPLOAD STUDENT PROFILE PHOTO
// ===============================
router.post("/upload-photo/:userid", upload.single("photo"), async (req, res) => {
  try {
    // ✅ Check if file exists
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // ✅ Update student profile with photo path
    const student = await Student.findOneAndUpdate(
      { userid: req.params.userid },
      { photo: `/uploads/students/${req.file.filename}` },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({
      success: true,
      message: "Profile photo uploaded successfully!",
      photo: student.photo,
    });
  } catch (err) {
    console.error("❌ Upload Photo Error:", err);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

// ===============================
// 🔹 FETCH STUDENT PROFILE
// ===============================
router.get("/profile/:userid", async (req, res) => {
  try {
    const student = await Student.findOne({ userid: req.params.userid });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({
      success: true,
      student: {
        userid: student.userid,
        name: student.name,
        rollno: student.rollno,
        regno: student.regno,
        department: student.department,
        class: student.class,
        photo: student.photo || null,
      },
    });
  } catch (err) {
    console.error("❌ Fetch Profile Error:", err);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

export default router;
