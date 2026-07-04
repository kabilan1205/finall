import express from "express";
import Hod from "../models/Hod.js"; // HOD schema

const router = express.Router();

// ✅ HOD Login Route (without bcrypt)
router.post("/login", async (req, res) => {
  try {
    const { userid, password } = req.body;

    // HOD check
    const hod = await Hod.findOne({ userid });
    if (!hod) return res.status(404).json({ message: "HOD not found" });

    // ✅ Plain password check (no bcrypt)
    if (hod.password !== password) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // ✅ Send name + department
    res.json({
      success: true,
      message: "Login successful",
      userid: hod.userid,
      name: hod.name,
      department: hod.department,   // 🔹 added department
    });
  } catch (err) {
    console.error("❌ HOD Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:advisorUserid/today-summary", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const className = req.query.class;

    const summary = await Attendance.findOne({ date: today, class: className });
    res.json(summary || {});
  } catch (err) {
    console.error("❌ HOD Today Summary Error:", err);
    res.status(500).json({});
  }
});

export default router;


