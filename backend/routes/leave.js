import express from "express";
import Leave from "../models/Leave.js";
import Student from "../models/Student.js";

const router = express.Router();

/**
 * ✅ Submit leave request (Only today & future dates allowed)
 */
router.post("/submit", async (req, res) => {
  try {
    const { userid, name, reason, date } = req.body;

    if (!userid || !name || !reason || !date) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leaveDate = new Date(date);
    leaveDate.setHours(0, 0, 0, 0);

    if (leaveDate < today) {
      return res.status(400).json({ success: false, message: "❌ Leave can only be requested for today or future dates" });
    }

    const student = await Student.findOne({ userid });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const leave = new Leave({
      userid,
      name,
      reason,
      date: leaveDate,
      department: student.department,
      class: student.class,
      studentRegNo: student.regno,
      advisorStatus: "pending",
      hodStatus: "pending",
      finalStatus: "pending",
    });

    await leave.save();
    res.json({ success: true, message: "Leave request submitted successfully", leave });
  } catch (err) {
    console.error("Error submitting leave request:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * ✅ Fetch leave requests of a student
 */
router.get("/mine", async (req, res) => {
  try {
    const { userid } = req.query;
    if (!userid) return res.status(400).json({ success: false, message: "Userid is required" });

    const requests = await Leave.find({ userid }).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    console.error("Error fetching student leave requests:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * ✅ Fetch all leave requests (advisor dashboard)
 */
router.get("/all", async (req, res) => {
  try {
    const requests = await Leave.find().sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (err) {
    console.error("Error fetching all leave requests:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * ✅ Advisor updates leave
 */
router.put("/:id/advisor", async (req, res) => {
  try {
    const { status } = req.body; // approved or rejected
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });

    leave.advisorStatus = status;

    // Update final status
    if (leave.advisorStatus === "approved" && leave.hodStatus === "approved") leave.finalStatus = "Approved";
    else if (status === "rejected") leave.finalStatus = "Rejected";
    else leave.finalStatus = "pending";

    await leave.save();
    res.json({ success: true, message: "Advisor updated leave", leave });
  } catch (err) {
    console.error("Error updating advisor leave:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * ✅ HOD updates leave
 */
router.put("/:id/hod", async (req, res) => {
  try {
    const { status } = req.body; // approved or rejected
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });

    leave.hodStatus = status;

    // Update final status
    if (leave.advisorStatus === "approved" && leave.hodStatus === "approved") leave.finalStatus = "Approved";
    else if (status === "rejected") leave.finalStatus = "Rejected";
    else leave.finalStatus = "pending";

    await leave.save();
    res.json({ success: true, message: "HOD updated leave", leave });
  } catch (err) {
    console.error("Error updating HOD leave:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * ✅ Delete leave request
 */
router.delete("/:id/delete", async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: "Leave request not found" });

    await Leave.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Leave request deleted successfully" });
  } catch (err) {
    console.error("Error deleting leave request:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
