import express from "express";
import Advisor from "../models/Advisor.js";
import Student from "../models/Student.js";

const router = express.Router();

function looksLikeObjectId(str) {
  return typeof str === "string" && /^[0-9a-fA-F]{24}$/.test(str);
}

/* ------------------ LOGIN ------------------ */
router.post("/login", async (req, res) => {
  try {
    const { userid, password } = req.body;
    const advisor = await Advisor.findOne({ userid });
    if (!advisor) return res.status(404).json({ message: "Advisor not found!" });

    if (password !== advisor.password)
      return res.status(401).json({ message: "Invalid password!" });

    return res.status(200).json({
      message: "Login successful",
      userid: advisor.userid,
      advisorName: advisor.name,
      department: advisor.department,
      year: advisor.year,
      class: advisor.class,
      subjects: advisor.subjects || []
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ------------------ PROFILE ------------------ */
router.get("/profile/:userid", async (req, res) => {
  try {
    const advisor = await Advisor.findOne({ userid: req.params.userid });
    if (!advisor) return res.status(404).json({ message: "Advisor not found!" });
    return res.status(200).json(advisor);
  } catch (err) {
    console.error("Profile Fetch Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ------------------ STUDENTS FOR ADVISOR ------------------ */
router.get("/:userid/students", async (req, res) => {
  const advisorUserid = req.params.userid;

  try {
    const advisor = await Advisor.findOne({ userid: advisorUserid }).lean();

    // --- BY CLASS ---
    if (advisor) {
      const studentsByClass = await Student.find({ class: advisor.class })
        .select("name regno attendancePercentage rollno class department advisorUserid advisorId")
        .sort({ regno: 1 })   // 🔥 REG NO SORT
        .lean();

      if (studentsByClass.length > 0)
        return res.status(200).json({ students: studentsByClass });

      // --- BY advisorId ---
      if (advisor._id) {
        const byAdvisorId = await Student.find({ advisorId: advisor._id })
          .sort({ regno: 1 })   // 🔥 REG NO SORT
          .lean();

        if (byAdvisorId.length > 0)
          return res.status(200).json({ students: byAdvisorId });
      }
    }

    // --- FALLBACK BY advisorUserid STRING ---
    const studentsByString = await Student.find({ advisorUserid })
      .select("name regno attendancePercentage rollno class department advisorUserid advisorId")
      .sort({ regno: 1 })   // 🔥 REG NO SORT
      .lean();

    if (studentsByString.length > 0)
      return res.status(200).json({ students: studentsByString });

    // --- IF ObjectId FORMAT ---
    if (looksLikeObjectId(advisorUserid)) {
      const studentsByAdvisorId = await Student.find({ advisorId: advisorUserid })
        .sort({ regno: 1 })   // 🔥 REG NO SORT
        .lean();

      if (studentsByAdvisorId.length > 0)
        return res.status(200).json({ students: studentsByAdvisorId });
    }

    return res.status(200).json({ students: [] });

  } catch (err) {
    console.error("Students Fetch Error:", err);
    return res.status(500).json({ message: "Server error", students: [] });
  }
});

export default router;
