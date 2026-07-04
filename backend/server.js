import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

// --------------------------
// MIDDLEWARE
// --------------------------

// Logging (helps debug routes)
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// JSON parsers
app.use(express.json());
app.use(bodyParser.json());

// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// CORS settings
const allowedOrigins = ["http://localhost:5500", "http://127.0.0.1:5500"];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.includes(origin)) {
        return callback(new Error("CORS Not Allowed"), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Sessions
app.use(
  session({
    secret: "secret123",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// --------------------------
// ROUTES IMPORT
// --------------------------
import studentRoutes from "./routes/studentRoutes.js";
import advisorRoutes from "./routes/advisorRoutes.js";
import hodRoutes from "./routes/hodRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import leaveRoutes from "./routes/leave.js";

// Mongoose Models for shim route
import Advisor from "./models/Advisor.js";
import Student from "./models/Student.js";

// --------------------------
// USE ROUTES
// --------------------------
app.use("/api/students", studentRoutes);
app.use("/api/advisor", advisorRoutes);
app.use("/api/hod", hodRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);

// --------------------------
// TODAY SUMMARY — SHIM ROUTE
// (This ensures frontend path always works)
// --------------------------
app.get("/api/attendance/:advisorUserid/today-summary", async (req, res) => {
  try {
    const { advisorUserid } = req.params;

    console.log("📌 Today Summary Requested For:", advisorUserid);

    // try to find advisor
    const advisor = await Advisor.findOne({ userid: advisorUserid }).lean();

    let students = [];

    if (advisor) {
      // Prefer class-based student load
      students = await Student.find({ class: advisor.class }).lean();
    }

    // fallback: students who store advisorUserid directly
    if (!students.length) {
      students = await Student.find({ advisorUserid }).lean();
    }

    // fallback: if advisorUserid looks like ObjectId
    if (!students.length && /^[0-9a-fA-F]{24}$/.test(advisorUserid)) {
      students = await Student.find({ advisorId: advisorUserid }).lean();
    }

    const today = new Date().toISOString().split("T")[0];

    let total = students.length;
    let present = 0,
      od = 0,
      approved = 0,
      unapproved = 0;

    const absentStudents = [];
    const odStudents = [];

    for (const s of students) {
      const rec =
        Array.isArray(s.attendance) &&
        s.attendance.find((x) => x.date === today);

      if (!rec) {
        unapproved++;
        absentStudents.push({ name: s.name, regno: s.regno });
      } else {
        if (rec.status === "Present") present++;
        else if (rec.status === "OD") {
          od++;
          odStudents.push({ name: s.name, regno: s.regno });
        } else if (rec.status === "Approved") approved++;
        else {
          unapproved++;
          absentStudents.push({ name: s.name, regno: s.regno });
        }
      }
    }

    res.json({
      date: today,
      year: advisor?.year || "Unknown",
      department: advisor?.department || students[0]?.department || "Unknown",
      totalStudents: total,
      present,
      absentCount: unapproved,
      od,
      approved,
      unapproved,
      absentStudents,
      odStudents,
    });
  } catch (err) {
    console.error("❌ Summary Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --------------------------
// FRONTEND TEST PAGE
// --------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "canva.html"));
});

// --------------------------
// MONGODB CONNECT & START SERVER
// --------------------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));
