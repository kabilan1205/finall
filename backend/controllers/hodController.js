import StudentRequest from "../models/StudentRequest.js";
import { generatePDF, generateCSV } from "../services/reportService.js";

export const getDashboardStats = async (req, res) => {
  const total = await StudentRequest.countDocuments();
  const approved = await StudentRequest.countDocuments({ status: "Approved" });
  const rejected = await StudentRequest.countDocuments({ status: "Rejected" });
  res.json({ total, approved, rejected });
};

export const getAllRequests = async (req, res) => {
  const data = await StudentRequest.find().sort({ createdAt: -1 });
  res.json(data);
};

export const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  await StudentRequest.findByIdAndUpdate(id, { status });
  res.json({ success: true });
};

export const downloadPDF = async (req, res) => {
  const data = await StudentRequest.find();
  const fileBuffer = await generatePDF(data);
  res.setHeader("Content-Type", "application/pdf");
  res.send(fileBuffer);
};

export const downloadCSV = async (req, res) => {
  const data = await StudentRequest.find();
  const fileBuffer = await generateCSV(data);
  res.setHeader("Content-Type", "text/csv");
  res.send(fileBuffer);
};
