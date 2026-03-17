const PDFDocument = require('pdfkit');
const Village = require('../models/Village');
const VillageSubmission = require('../models/VillageSubmission');
const QuestionCategory = require('../models/QuestionCategory');
const axios = require('axios');

exports.generateVillageReport = async (req, res) => {
  try {
    const { villageId } = req.params;

    // Fetch village data with all related information
    const village = await Village.findById(villageId)
      .populate('competition', 'name totalMarks');

    if (!village) {
      return res.status(404).json({ message: 'Village not found' });
    }

    // Fetch all submissions for this village
    const submissions = await VillageSubmission.find({ village: villageId })
      .populate('category', 'title totalMarks');

    // Fetch categories with questions
    const categories = await QuestionCategory.find({ 
      competition: village.competition._id 
    });

    // Create PDF document with better font support
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Village_Report_${village.name.replace(/\s+/g, '_')}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    await generatePDFContent(doc, village, submissions, categories);

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};

async function downloadImage(url) {
  try {
    console.log('Downloading image from:', url);
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 15000,
      maxContentLength: 10 * 1024 * 1024, // 10MB max
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDFGenerator/1.0)'
      }
    });
    console.log('Image downloaded successfully, size:', response.data.byteLength);
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error downloading image from', url, ':', error.message);
    return null;
  }
}

async function generatePDFContent(doc, village, submissions, categories) {
  const pageWidth = doc.page.width - 100; // Account for margins
  
  // Helper function to add text with proper wrapping
  const addWrappedText = (text, options = {}) => {
    const defaultOptions = {
      width: pageWidth,
      align: 'left',
      ...options
    };
    doc.text(text, defaultOptions);
  };

  // Helper function to check if new page is needed
  const checkPageBreak = (requiredSpace = 100) => {
    if (doc.y > doc.page.height - 100 - requiredSpace) {
      doc.addPage();
      return true;
    }
    return false;
  };

  // Helper function to safely embed image
  const embedImage = async (imageUrl, maxWidth = pageWidth, maxHeight = 300) => {
    if (!imageUrl) return false;
    
    // Check if it's an image URL
    if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      doc.fontSize(9).fillColor('#6b7280')
        .text(`📄 Document: ${imageUrl}`, { width: pageWidth, link: imageUrl });
      return false;
    }

    const imageBuffer = await downloadImage(imageUrl);
    if (!imageBuffer) {
      doc.fontSize(9).fillColor('#dc2626')
        .text(`⚠ Failed to load image: ${imageUrl}`, { width: pageWidth });
      return false;
    }

    try {
      checkPageBreak(maxHeight + 50);
      doc.image(imageBuffer, {
        fit: [maxWidth, maxHeight],
        align: 'center'
      });
      doc.moveDown(0.5);
      return true;
    } catch (err) {
      console.error('Error embedding image:', err);
      doc.fontSize(9).fillColor('#dc2626')
        .text(`⚠ Error displaying image: ${imageUrl}`, { width: pageWidth });
      return false;
    }
  };
  
  // Title Page with better styling
  doc.fontSize(28).font('Helvetica-Bold')
    .fillColor('#1e40af')
    .text('गाव प्रगती अहवाल', { align: 'center' });
  doc.fontSize(24).fillColor('#000000')
    .text('Village Progress Report', { align: 'center' });
  
  doc.moveDown(2);
  
  // Village name in larger font
  doc.fontSize(22).font('Helvetica-Bold')
    .fillColor('#1f2937')
    .text(village.name, { align: 'center' });
  
  doc.moveDown();
  
  // Competition and status info
  doc.fontSize(14).font('Helvetica')
    .fillColor('#4b5563')
    .text(`स्पर्धा / Competition: ${village.competition?.name || 'N/A'}`, { align: 'center' });
  doc.text(`क्रमांक / Rank: #${village.rank || 'N/A'}`, { align: 'center' });
  doc.text(`स्थिती / Status: ${village.status}`, { align: 'center' });
  
  doc.moveDown(3);

  // Add decorative line
  doc.strokeColor('#3b82f6').lineWidth(2)
    .moveTo(150, doc.y).lineTo(doc.page.width - 150, doc.y).stroke();

  // Village Information Section
  doc.addPage();
  addSectionHeader(doc, '१. गाव माहिती / Village Information');
  
  addKeyValue(doc, 'गावाचे नाव / Village Name', village.name);
  addKeyValue(doc, 'ईमेल / Email', village.email);
  addKeyValue(doc, 'जिल्हा / District', village.district || village.baseline?.district || 'N/A');
  addKeyValue(doc, 'लोकसंख्या / Population', village.population?.toLocaleString('en-IN') || 'N/A');
  addKeyValue(doc, 'सध्याचा टप्पा / Current Stage', village.stage?.replace(/_/g, ' '));
  addKeyValue(doc, 'स्थिती / Status', village.status);
  addKeyValue(doc, 'अर्ज दिनांक / Application Date', village.createdAt ? new Date(village.createdAt).toLocaleDateString('en-IN') : 'N/A');
  
  doc.moveDown();

  // Calculate total marks
  const totalMarks = submissions.reduce((sum, s) => sum + (s.totalMarks || 0), 0);
  doc.fontSize(12).font('Helvetica-Bold')
    .fillColor('#059669')
    .text(`एकूण गुण / Total Marks: ${totalMarks.toFixed(2)} / ${village.competition?.totalMarks || 'N/A'}`, { 
      align: 'center',
      underline: true 
    });

  doc.moveDown(2);

  // Application Details Section
  if (village.applicationLetterUrl) {
    checkPageBreak(150);
    addSectionHeader(doc, '२. अर्ज तपशील / Application Details');
    addKeyValue(doc, 'अर्ज पत्र / Application Letter', 'सबमिट केले / Submitted');
    doc.moveDown();
    
    await embedImage(village.applicationLetterUrl, pageWidth, 350);
    doc.moveDown();
  }

  // Baseline Information Section
  if (village.baseline) {
    doc.addPage();
    addSectionHeader(doc, '३. बेसलाइन माहिती / Baseline Information');
    
    if (typeof village.baseline === 'object') {
      Object.entries(village.baseline).forEach(([key, value]) => {
        if (key !== 'proofUrl' && value) {
          const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          addKeyValue(doc, formattedKey, value.toString());
        }
      });
    }
    
    // Embed baseline proof image if available
    if (village.baseline.proofUrl) {
      doc.moveDown();
      addKeyValue(doc, 'बेसलाइन पुरावा / Baseline Proof', 'सबमिट केले / Submitted');
      doc.moveDown();
      
      await embedImage(village.baseline.proofUrl, pageWidth, 400);
    }
    
    doc.moveDown();
  }

  // Category Submissions Section
  doc.addPage();
  addSectionHeader(doc, '४. श्रेणीनुसार कामगिरी / Category-wise Performance');
  doc.moveDown();

  for (const submission of submissions) {
    const category = categories.find(c => c._id.toString() === submission.category.toString());
    
    if (!category) continue;

    checkPageBreak(80);

    // Category Header with box
    doc.rect(50, doc.y, pageWidth, 40).fillAndStroke('#eff6ff', '#3b82f6');
    const categoryY = doc.y;
    doc.fillColor('#1e40af').fontSize(14).font('Helvetica-Bold')
      .text(category.title, 60, categoryY + 10, { width: pageWidth - 20 });
    doc.fillColor('#000000').fontSize(11).font('Helvetica')
      .text(`गुण / Marks: ${submission.totalMarks.toFixed(2)} / ${category.totalMarks}`, 60, categoryY + 28);
    doc.y = categoryY + 50;
    doc.moveDown();

    // Questions and Answers
    for (const answer of submission.answers) {
      const question = category.questions.find(q => q._id.toString() === answer.questionId.toString());
      
      if (!question) continue;

      checkPageBreak(150);

      // Question box with better Marathi support
      doc.fontSize(11).font('Helvetica-Bold')
        .fillColor('#374151');
      
      // Wrap question text properly
      addWrappedText(`प्रश्न / Question: ${question.text}`, { 
        indent: 10,
        width: pageWidth - 20
      });
      doc.moveDown(0.5);

      // Answer based on type
      doc.fontSize(10).font('Helvetica')
        .fillColor('#000000');

      if (question.type === 'quantity') {
        addKeyValue(doc, '  लक्ष्य / Target', question.targetValue?.toString() || 'N/A');
        addKeyValue(doc, '  साध्य केले / Achieved', answer.achievedValue?.toString() || '0');
        addKeyValue(doc, '  गुण / Marks', `${answer.awardedMarks?.toFixed(2) || 0} / ${question.maxMarks}`);
      } else if (question.type === 'mcq_weighted') {
        const selectedOption = question.options?.find(o => o.value === answer.selectedOption);
        const optionText = selectedOption?.label || answer.selectedOption || 'N/A';
        addKeyValue(doc, '  निवडलेले / Selected', optionText);
        addKeyValue(doc, '  गुण / Marks', `${answer.awardedMarks?.toFixed(2) || 0} / ${question.maxMarks}`);
      } else if (question.type === 'text') {
        // Handle long text answers with wrapping
        doc.fontSize(10).font('Helvetica-Bold')
          .fillColor('#374151')
          .text('  उत्तर / Answer: ', 50, doc.y, { continued: false });
        doc.font('Helvetica')
          .fillColor('#000000');
        addWrappedText(answer.textAnswer || 'N/A', { 
          indent: 20,
          width: pageWidth - 40
        });
        doc.moveDown(0.3);
        addKeyValue(doc, '  गुण / Marks', `${answer.awardedMarks?.toFixed(2) || 0} / ${question.maxMarks}`);
      }

      // Embed proof image if available
      if (answer.proofUrl) {
        doc.moveDown(0.5);
        doc.fillColor('#059669').fontSize(10).font('Helvetica-Bold')
          .text('  ✓ पुरावा सबमिट केला / Proof Submitted', { indent: 10 });
        doc.moveDown(0.5);
        
        await embedImage(answer.proofUrl, pageWidth - 40, 280);
      }

      doc.fillColor('#000000');
      doc.moveDown(0.5);
      
      // Add separator line
      doc.strokeColor('#e5e7eb').lineWidth(0.5)
        .moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).stroke();
      doc.moveDown();
    }

    doc.moveDown();
  }

  // Summary Section
  doc.addPage();
  addSectionHeader(doc, '५. सारांश / Summary');
  doc.moveDown();

  const categoryBreakdown = submissions.map(s => {
    const cat = categories.find(c => c._id.toString() === s.category?.toString());
    return {
      category: cat?.title || s.category?.title || 'Unknown',
      marks: s.totalMarks?.toFixed(2) || '0.00',
      maxMarks: cat?.totalMarks || 0
    };
  });

  doc.fontSize(12).font('Helvetica-Bold').text('श्रेणीनुसार तपशील / Category-wise Breakdown:');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');

  categoryBreakdown.forEach(item => {
    addWrappedText(`• ${item.category}: ${item.marks} / ${item.maxMarks}`, { indent: 20 });
  });

  doc.moveDown(2);
  
  // Total score in highlighted box
  const boxY = doc.y;
  doc.rect(50, boxY, pageWidth, 50).fillAndStroke('#dcfce7', '#16a34a');
  doc.fillColor('#166534').fontSize(14).font('Helvetica-Bold')
    .text(`एकूण गुण / Total Score: ${totalMarks.toFixed(2)} / ${village.competition?.totalMarks || 'N/A'}`, 
      60, boxY + 15, { width: pageWidth - 20, align: 'center' });
  doc.y = boxY + 60;

  // Footer on last page
  doc.moveDown(4);
  doc.fontSize(9).font('Helvetica')
    .fillColor('#6b7280')
    .text(`अहवाल तयार केला / Report Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
  doc.text('हा प्रणाली-निर्मित अहवाल आहे / This is a system-generated report', { align: 'center' });
}

function addSectionHeader(doc, title) {
  doc.fontSize(16).font('Helvetica-Bold')
    .fillColor('#1f2937')
    .text(title);
  doc.moveDown(0.3);
  doc.strokeColor('#3b82f6')
    .lineWidth(2)
    .moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .stroke();
  doc.moveDown();
  doc.fillColor('#000000');
}

function addKeyValue(doc, key, value) {
  const currentY = doc.y;
  doc.fontSize(10).font('Helvetica-Bold')
    .fillColor('#374151')
    .text(`${key}: `, 50, currentY, { continued: true, width: 500 })
    .font('Helvetica')
    .fillColor('#000000')
    .text(value || 'N/A', { width: 500 });
  doc.moveDown(0.3);
}
