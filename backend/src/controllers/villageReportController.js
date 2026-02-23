const PDFDocument = require("pdfkit");
const axios = require("axios");
const Village = require("../models/Village");
const VillageSubmission = require("../models/VillageSubmission");
const QuestionCategory = require("../models/QuestionCategory");

/**
 * ADMIN: DOWNLOAD FULL VILLAGE REPORT (PDF)
 */
exports.downloadVillageReport = async (req, res) => {
  try {
    const village = await Village.findById(req.params.id)
      .populate("competition")
      .populate("user");

    if (!village) {
      return res.status(404).json({ message: "Village not found" });
    }

    const submissions = await VillageSubmission.find({
      village: village._id
    }).populate("category");

    // Create PDF
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${village.name}_report.pdf`
    );

    doc.pipe(res);

    /* ================= HEADER ================= */
    doc.fontSize(18).text("SAPREM NGO", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(14).text("Village Evaluation Report", { align: "center" });
    doc.moveDown();

    /* ================= BASIC INFO ================= */
    doc.fontSize(11);
    doc.text(`Village Name: ${village.name}`);
    doc.text(`Email: ${village.email}`);
    doc.text(`Competition: ${village.competition?.name || "N/A"}`);
    doc.text(`Status: ${village.status}`);
    doc.text(`Stage: ${village.stage}`);
    doc.moveDown();

    /* ================= BASELINE ================= */
    doc.fontSize(13).text("Baseline Survey", { underline: true });
    doc.moveDown(0.5);

    if (village.baseline) {
      Object.entries(village.baseline).forEach(([key, value]) => {
        if (key !== "proofUrl") {
          doc.fontSize(10).text(`${key}: ${value}`);
        }
      });

      if (village.baseline.proofUrl) {
        await embedProof(doc, village.baseline.proofUrl);
      }
    } else {
      doc.text("No baseline data submitted.");
    }

    doc.addPage();

    /* ================= CATEGORY SUBMISSIONS ================= */
    let grandTotal = 0;

    for (const submission of submissions) {
      doc.fontSize(13).text(
        submission.category.title,
        { underline: true }
      );
      doc.moveDown(0.5);

      submission.answers.forEach(ans => {
        doc.fontSize(10).text(
          `• Marks: ${ans.awardedMarks}`
        );
        if (ans.achievedValue !== undefined) {
          doc.text(`  Achieved: ${ans.achievedValue}`);
        }
        if (ans.selectedOption) {
          doc.text(`  Selected: ${ans.selectedOption}`);
        }
        if (ans.textAnswer) {
          doc.text(`  Answer: ${ans.textAnswer}`);
        }
        doc.moveDown(0.3);
      });

      doc.fontSize(11).text(
        `Category Total: ${submission.totalMarks}`,
        { align: "right" }
      );

      grandTotal += submission.totalMarks;
      doc.moveDown();

      // Proofs
      for (const ans of submission.answers) {
        if (ans.proofUrl) {
          await embedProof(doc, ans.proofUrl);
        }
      }

      doc.addPage();
    }

    /* ================= GRAND TOTAL ================= */
    doc.fontSize(14).text("Final Score", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Total Obtained Marks: ${grandTotal}`);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= HELPER: EMBED PROOF ================= */
async function embedProof(doc, url) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer"
    });

    const contentType = response.headers["content-type"];

    if (contentType.includes("image")) {
      doc.addPage();
      doc.fontSize(12).text("Proof Image", { underline: true });
      doc.moveDown();
      doc.image(response.data, {
        fit: [450, 600],
        align: "center"
      });
    } else if (contentType.includes("pdf")) {
      doc.addPage();
      doc.fontSize(12).text(
        "Proof Document (PDF attached separately)",
        { underline: true }
      );
    }
  } catch (err) {
    doc.addPage();
    doc.text("⚠ Failed to load proof");
  }
}