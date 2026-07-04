import express from "express";
import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";
import Advisor from "../models/Advisor.js";

const router = express.Router();

/* ---------------- HELPERS ---------------- */

function normReg(reg) {
  return reg ? String(reg).trim() : "";
}

function getISTDate() {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  return ist.toISOString().split("T")[0];
}

/* =====================================================
   SAVE ATTENDANCE
===================================================== */
router.post("/", async (req, res) => {
  try {
    const { advisorUserid, attendance } = req.body;
    if (!advisorUserid || !Array.isArray(attendance))
      return res.status(400).json({ success: false });

    const advisor = await Advisor.findOne({ userid: advisorUserid }).lean();

    let students = [];
    if (advisor?.class)
      students = await Student.find({ class: advisor.class }).lean();
    if (!students.length)
      students = await Student.find({ advisorUserid }).lean();
    if (!students.length)
      students = await Student.find({ advisorId: advisorUserid }).lean();

    if (!students.length)
      return res.status(404).json({ success: false, message: "No students" });

    const regMap = new Map();
    students.forEach(s => regMap.set(normReg(s.regno), s));

    const today = getISTDate();

    const bulk = attendance.map(item => {
      const reg = normReg(item.regno);
      const info = regMap.get(reg) || {};

      return {
        updateOne: {
          filter: { regno: reg, date: today },
          update: {
            $set: {
              name: info.name || item.name || reg,
              rollno: info.rollno || "",
              status: item.status || "Absent",
              approved: item.status === "Approved",
              class: advisor?.class || "",
              advisorUserid,
              reason: item.reason || ""
            }
          },
          upsert: true
        }
      };
    });

    await Attendance.bulkWrite(bulk);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* =====================================================
   TODAY SUMMARY (NAME FIXED HERE)
===================================================== */
router.get("/:advisorUserid/today-summary", async (req, res) => {
  try {
    const today = getISTDate();
    const { advisorUserid } = req.params;

    const advisor = await Advisor.findOne({ userid: advisorUserid }).lean();

    let students = [];
    if (advisor?.class)
      students = await Student.find({ class: advisor.class })
        .select("regno name rollno department year")
        .lean();

    if (!students.length)
      students = await Student.find({ advisorUserid })
        .select("regno name rollno department year")
        .lean();

    if (!students.length)
      students = await Student.find({ advisorId: advisorUserid })
        .select("regno name rollno department year")
        .lean();

    const regMap = new Map();
    students.forEach(s => regMap.set(normReg(s.regno), s));

    const recs = await Attendance.find({ advisorUserid, date: today }).lean();

    const present = recs.filter(r => r.status === "Present").length;
    const od = recs.filter(r => r.status === "OD").length;
    const approved = recs.filter(r => r.status === "Approved").length;
    const unapproved = recs.filter(r => r.status === "Unapproved").length;

    const absentStudents = [];
    const odStudents = [];

    recs.forEach(r => {
      const reg = normReg(r.regno);
      const info = regMap.get(reg) || {};

      if (r.status === "OD") {
        odStudents.push({
          name: info.name || reg,
          regno: reg,
          rollno: info.rollno || "",
          reason: r.reason || ""
        });
      }

      if (r.status === "Approved" || r.status === "Unapproved") {
        absentStudents.push({
          name: info.name || reg,
          regno: reg,
          rollno: info.rollno || "",
          reason: r.reason || "uninformed"
        });
      }
    });

    const marked = new Set(recs.map(r => normReg(r.regno)));

    students.forEach(s => {
      const reg = normReg(s.regno);
      if (!marked.has(reg)) {
        absentStudents.push({
          name: s.name || reg,
          regno: reg,
          rollno: s.rollno || "",
          reason: "uninformed"
        });
      }
    });

    res.json({
      success: true,
      date: today,
      year: advisor?.year || students[0]?.year || "Unknown",
      department: advisor?.department || students[0]?.department || "Unknown",
      totalStudents: students.length,
      present,
      absentCount: absentStudents.length,
      od,
      approved,
      unapproved,
      absentStudents,
      odStudents
    });

  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* =====================================================
   STUDENT TODAY STATUS
===================================================== */
router.get("/today/:userid", async (req, res) => {
  try {
    const student = await Student.findOne({ userid: req.params.userid }).lean();
    if (!student) return res.status(404).json({ success: false });

    const today = getISTDate();
    const record = await Attendance.findOne({
      regno: normReg(student.regno),
      date: today
    });

    res.json({
      success: true,
      status: record?.status || "Not Marked",
      date: today
    });
  } catch {
    res.status(500).json({ success: false });
  }
});

router.get("/hod/today-summary", async (req, res) => {
  try {
    const today = getISTDate();

    const records = await Attendance.find({ date: today }).lean();

    const classMap = {};
    const overall = {
      total: 0,
      present: 0,
      absent: 0,
      od: 0,
      approved: 0,
      unapproved: 0
    };

    records.forEach(r => {
      const cls = r.class || "Unknown";

      if (!classMap[cls]) {
        classMap[cls] = {
          class: cls,
          total: 0,
          present: 0,
          absent: 0,
          od: 0,
          approved: 0,
          unapproved: 0
        };
      }

      classMap[cls].total++;
      overall.total++;

      if (r.status === "Present") {
        classMap[cls].present++;
        overall.present++;
      } else if (r.status === "OD") {
        classMap[cls].od++;
        overall.od++;
      } else if (r.status === "Approved") {
        classMap[cls].approved++;
        overall.approved++;
        classMap[cls].absent++;
        overall.absent++;
      } else if (r.status === "Unapproved") {
        classMap[cls].unapproved++;
        overall.unapproved++;
        classMap[cls].absent++;
        overall.absent++;
      } else {
        classMap[cls].absent++;
        overall.absent++;
      }
    });

    res.json({
      success: true,
      date: today,
      overall,                 // ✅ THIS WAS MISSING / WRONG
      classes: Object.values(classMap)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

router.get("/hod/today-summary", async (req, res) => {
  try {
    const today = getISTDate();

    // 🔥 FETCH ALL ATTENDANCE FOR TODAY
    const records = await Attendance.find({ date: today }).lean();

    if (!records.length) {
      return res.json({
        success: true,
        date: today,
        overall: {
          total: 0, present: 0, absent: 0, od: 0, approved: 0, unapproved: 0
        },
        classes: []
      });
    }

    const overall = {
      total: 0,
      present: 0,
      absent: 0,
      od: 0,
      approved: 0,
      unapproved: 0
    };

    const classMap = {};

    records.forEach(r => {
      const cls = r.class || "Unknown";

      if (!classMap[cls]) {
        classMap[cls] = {
          class: cls,
          total: 0,
          present: 0,
          absent: 0,
          od: 0,
          approved: 0,
          unapproved: 0
        };
      }

      // every record = one student
      classMap[cls].total++;
      overall.total++;

      if (r.status === "Present") {
        classMap[cls].present++;
        overall.present++;
      }
      else if (r.status === "OD") {
        classMap[cls].od++;
        overall.od++;
      }
      else if (r.status === "Approved") {
        classMap[cls].approved++;
        classMap[cls].absent++;
        overall.approved++;
        overall.absent++;
      }
      else if (r.status === "Unapproved") {
        classMap[cls].unapproved++;
        classMap[cls].absent++;
        overall.unapproved++;
        overall.absent++;
      }
      else {
        classMap[cls].absent++;
        overall.absent++;
      }
    });

    res.json({
      success: true,
      date: today,
      overall,
      classes: Object.values(classMap)
    });

  } catch (err) {
    console.error("HOD summary error:", err);
    res.status(500).json({ success: false });
  }
});
router.get("/hod/class-summary/:className", async (req, res) => {
  try {
    const today = getISTDate();
    const className = decodeURIComponent(req.params.className);

    const records = await Attendance.find({
      date: today,
      class: className
    }).lean();

    const summary = {
      total: 0,
      present: 0,
      absent: 0,
      od: 0,
      approved: 0,
      unapproved: 0
    };

    const absentees = [];
    const odStudents = [];

    records.forEach(r => {
      summary.total++;

      const studentName =
        r.studentName || r.name || r.student || "Unknown";

      if (r.status === "Present") {
        summary.present++;
      }

      else if (r.status === "OD") {
        summary.od++;
        odStudents.push({ name: studentName });
      }

      else if (r.status === "Approved") {
        summary.approved++;
        summary.absent++;
        absentees.push({
          name: studentName,
          reason: "approved leave"
        });
      }

      else if (r.status === "Unapproved") {
        summary.unapproved++;
        summary.absent++;
        absentees.push({
          name: studentName,
          reason: "uninformed"
        });
      }

      else {
        summary.absent++;
        absentees.push({
          name: studentName,
          reason: "absent"
        });
      }
    });

    res.json({
      success: true,
      
      date: today,
      class: className,
      summary,
      absentees,
      odStudents
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});



export default router;
