import PDFDocument from "pdfkit";
import { Readable } from "stream";
import { stringify } from "csv-stringify/sync";

export const generatePDF = (data) => {
  const doc = new PDFDocument();
  const stream = new Readable();
  const buffers = [];

  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", () => {
    stream.push(Buffer.concat(buffers));
    stream.push(null);
  });

  doc.fontSize(16).text("PREZENZO Student Requests Report", { align: "center" });
  doc.moveDown();

  data.forEach((req, index) => {
    doc.fontSize(12).text(`${index + 1}. ${req.name} - ${req.department} - ${req.status}`);
    doc.moveDown(0.5);
  });

  doc.end();
  return new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
  });
};

export const generateCSV = (data) => {
  const records = data.map(d => ({
    Name: d.name,
    RegNo: d.regNo,
    Department: d.department,
    Reason: d.reason,
    Status: d.status
  }));

  const csv = stringify(records, { header: true });
  return Buffer.from(csv);
};
