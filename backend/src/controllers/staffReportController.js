const Attendance = require("../models/Attendance");
const Staff = require("../models/Staff");
const StaffTask = require("../models/StaffTask");
const FieldVisit = require("../models/FieldVisit");
const VillageMeeting = require("../models/VillageMeeting");
const DailyWorkReport = require("../models/DailyWorkReport");
const PDFDocument = require('pdfkit');

// Get comprehensive staff report (for individual staff)
exports.getMyComprehensiveReport = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id }).populate('user', 'name email');
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1); // Start of current year
    const end = endDate ? new Date(endDate) : new Date(); // Today

    // Get all data for the staff member (excluding daily reports)
    const [attendance, tasks, visits, meetings] = await Promise.all([
      Attendance.find({
        staff: staff._id,
        date: { $gte: start, $lte: end }
      }).sort({ date: -1 }),
      
      StaffTask.find({
        assignedTo: staff._id,
        createdAt: { $gte: start, $lte: end }
      }).populate('village', 'name').sort({ createdAt: -1 }),
      
      FieldVisit.find({
        staff: staff._id,
        visitDate: { $gte: start, $lte: end }
      }).populate('village', 'name').sort({ visitDate: -1 }),
      
      VillageMeeting.find({
        conductedBy: staff._id,
        meetingDate: { $gte: start, $lte: end }
      }).populate('village', 'name').sort({ meetingDate: -1 })
    ]);

    // Calculate summaries
    const attendanceSummary = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      halfDay: attendance.filter(a => a.status === 'Half Day').length,
      leave: attendance.filter(a => a.status === 'Leave').length,
      totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0),
      averageWorkingHours: attendance.length > 0 
        ? (attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0) / attendance.length).toFixed(2)
        : 0
    };

    const taskSummary = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      ongoing: tasks.filter(t => t.status === 'Ongoing').length,
      assigned: tasks.filter(t => t.status === 'Assigned').length,
      onHold: tasks.filter(t => t.status === 'On Hold').length,
      totalTimeSpent: tasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0),
      completionRate: tasks.length > 0 ? ((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100).toFixed(1) : 0
    };

    const visitSummary = {
      total: visits.length,
      approved: visits.filter(v => v.approvalStatus === 'Approved').length,
      pending: visits.filter(v => v.approvalStatus === 'Pending').length,
      rejected: visits.filter(v => v.approvalStatus === 'Rejected').length,
      byPurpose: {
        survey: visits.filter(v => v.purpose === 'Survey').length,
        meeting: visits.filter(v => v.purpose === 'Meeting').length,
        monitoring: visits.filter(v => v.purpose === 'Monitoring').length,
        awareness: visits.filter(v => v.purpose === 'Awareness').length,
        training: visits.filter(v => v.purpose === 'Training').length,
        distribution: visits.filter(v => v.purpose === 'Distribution').length,
        other: visits.filter(v => v.purpose === 'Other').length
      }
    };

    const meetingSummary = {
      total: meetings.length,
      approved: meetings.filter(m => m.approvalStatus === 'Approved').length,
      pending: meetings.filter(m => m.approvalStatus === 'Pending').length,
      rejected: meetings.filter(m => m.approvalStatus === 'Rejected').length,
      totalParticipants: meetings.reduce((sum, m) => sum + (m.numberOfParticipants || 0), 0),
      averageParticipants: meetings.length > 0 ? (meetings.reduce((sum, m) => sum + (m.numberOfParticipants || 0), 0) / meetings.length).toFixed(1) : 0
    };

    res.json({
      staff: {
        id: staff._id,
        name: staff.name,
        employeeId: staff.employeeId,
        email: staff.user.email,
        department: staff.department,
        designation: staff.designation,
        project: staff.project,
        joiningDate: staff.joiningDate
      },
      period: { startDate: start, endDate: end },
      summary: {
        attendance: attendanceSummary,
        tasks: taskSummary,
        visits: visitSummary,
        meetings: meetingSummary
      },
      details: {
        attendance: attendance.slice(0, 50), // Latest 50 records
        tasks: tasks.slice(0, 50),
        visits: visits.slice(0, 50),
        meetings: meetings.slice(0, 50)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate PDF report for staff
exports.generateMyReportPDF = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id }).populate('user', 'name email');
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Get comprehensive data
    const reportData = await getStaffReportData(staff._id, start, end);

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Staff_Report_${staff.employeeId}_${new Date().toISOString().split('T')[0]}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Generate PDF content
    await generateStaffReportPDF(doc, staff, reportData, start, end);

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Error generating staff report PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};

// Get all staff reports (for admin)
exports.getAllStaffReports = async (req, res) => {
  try {
    const { startDate, endDate, department, project } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const staffFilter = { isActive: true };
    if (department) staffFilter.department = department;
    if (project) staffFilter.project = project;

    const allStaff = await Staff.find(staffFilter).populate('user', 'name email');

    const reports = await Promise.all(allStaff.map(async (staff) => {
      const [attendance, tasks, visits, meetings] = await Promise.all([
        Attendance.find({
          staff: staff._id,
          date: { $gte: start, $lte: end }
        }),
        StaffTask.find({
          assignedTo: staff._id,
          createdAt: { $gte: start, $lte: end }
        }),
        FieldVisit.find({
          staff: staff._id,
          visitDate: { $gte: start, $lte: end }
        }),
        VillageMeeting.find({
          conductedBy: staff._id,
          meetingDate: { $gte: start, $lte: end }
        })
      ]);

      return {
        staff: {
          id: staff._id,
          name: staff.name,
          employeeId: staff.employeeId,
          email: staff.user.email,
          department: staff.department,
          designation: staff.designation,
          project: staff.project
        },
        summary: {
          attendance: {
            totalDays: attendance.length,
            present: attendance.filter(a => a.status === 'Present').length,
            absent: attendance.filter(a => a.status === 'Absent').length,
            totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0)
          },
          tasks: {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'Completed').length,
            completionRate: tasks.length > 0 ? ((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100).toFixed(1) : 0
          },
          visits: {
            total: visits.length,
            approved: visits.filter(v => v.approvalStatus === 'Approved').length
          },
          meetings: {
            total: meetings.length,
            totalParticipants: meetings.reduce((sum, m) => sum + (m.numberOfParticipants || 0), 0)
          }
        }
      };
    }));

    res.json({
      period: { startDate: start, endDate: end },
      filters: { department: department || 'All', project: project || 'All' },
      totalStaff: reports.length,
      reports
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to get staff report data
async function getStaffReportData(staffId, startDate, endDate) {
  const [attendance, tasks, visits, meetings] = await Promise.all([
    Attendance.find({
      staff: staffId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 }),
    
    StaffTask.find({
      assignedTo: staffId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('village', 'name').sort({ createdAt: -1 }),
    
    FieldVisit.find({
      staff: staffId,
      visitDate: { $gte: startDate, $lte: endDate }
    }).populate('village', 'name').sort({ visitDate: -1 }),
    
    VillageMeeting.find({
      conductedBy: staffId,
      meetingDate: { $gte: startDate, $lte: endDate }
    }).populate('village', 'name').sort({ meetingDate: -1 })
  ]);

  return { attendance, tasks, visits, meetings };
}

// Helper function to generate PDF content
async function generateStaffReportPDF(doc, staff, data, startDate, endDate) {
  const pageWidth = doc.page.width - 100;

  // Title Page
  doc.fontSize(24).font('Helvetica-Bold')
    .fillColor('#1e40af')
    .text('Staff Performance Report', { align: 'center' });
  
  doc.moveDown();
  
  // Staff Information
  doc.fontSize(18).font('Helvetica-Bold')
    .fillColor('#1f2937')
    .text(staff.name, { align: 'center' });
  
  doc.fontSize(12).font('Helvetica')
    .fillColor('#4b5563')
    .text(`Employee ID: ${staff.employeeId}`, { align: 'center' });
  doc.text(`Department: ${staff.department}`, { align: 'center' });
  doc.text(`Designation: ${staff.designation}`, { align: 'center' });
  doc.text(`Report Period: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, { align: 'center' });
  
  doc.moveDown(2);

  // Summary Section
  addSectionHeader(doc, 'Performance Summary');
  
  // Attendance Summary
  const attendanceSummary = calculateAttendanceSummary(data.attendance);
  addSubSectionHeader(doc, 'Attendance Overview');
  addKeyValue(doc, 'Total Days Recorded', attendanceSummary.totalDays.toString());
  addKeyValue(doc, 'Present Days', attendanceSummary.present.toString());
  addKeyValue(doc, 'Absent Days', attendanceSummary.absent.toString());
  addKeyValue(doc, 'Total Working Hours', attendanceSummary.totalWorkingHours.toFixed(1));
  addKeyValue(doc, 'Average Working Hours/Day', attendanceSummary.averageWorkingHours);
  doc.moveDown();

  // Task Summary
  const taskSummary = calculateTaskSummary(data.tasks);
  addSubSectionHeader(doc, 'Task Performance');
  addKeyValue(doc, 'Total Tasks Assigned', taskSummary.total.toString());
  addKeyValue(doc, 'Completed Tasks', taskSummary.completed.toString());
  addKeyValue(doc, 'Ongoing Tasks', taskSummary.ongoing.toString());
  addKeyValue(doc, 'Task Completion Rate', `${taskSummary.completionRate}%`);
  addKeyValue(doc, 'Total Time Spent', `${taskSummary.totalTimeSpent} hours`);
  doc.moveDown();

  // Field Visits Summary
  const visitSummary = calculateVisitSummary(data.visits);
  addSubSectionHeader(doc, 'Field Visits');
  addKeyValue(doc, 'Total Visits', visitSummary.total.toString());
  addKeyValue(doc, 'Approved Visits', visitSummary.approved.toString());
  addKeyValue(doc, 'Pending Approval', visitSummary.pending.toString());
  doc.moveDown();

  // Meetings Summary
  const meetingSummary = calculateMeetingSummary(data.meetings);
  addSubSectionHeader(doc, 'Village Meetings');
  addKeyValue(doc, 'Total Meetings Conducted', meetingSummary.total.toString());
  addKeyValue(doc, 'Total Participants Reached', meetingSummary.totalParticipants.toString());
  addKeyValue(doc, 'Average Participants per Meeting', meetingSummary.averageParticipants);
  doc.moveDown();

  // Detailed Sections
  doc.addPage();
  addSectionHeader(doc, 'Detailed Records');

  // Recent Attendance (last 30 days)
  if (data.attendance.length > 0) {
    addSubSectionHeader(doc, 'Recent Attendance Records');
    data.attendance.slice(0, 30).forEach(record => {
      doc.fontSize(9).font('Helvetica')
        .text(`${new Date(record.date).toLocaleDateString()} - ${record.status} (${record.workingHours || 0}h)`, { indent: 20 });
    });
    doc.moveDown();
  }

  // Recent Tasks
  if (data.tasks.length > 0) {
    addSubSectionHeader(doc, 'Recent Tasks');
    data.tasks.slice(0, 20).forEach(task => {
      doc.fontSize(9).font('Helvetica')
        .text(`${task.title} - ${task.status} (${task.village?.name || 'General'})`, { indent: 20 });
    });
    doc.moveDown();
  }

  // Footer
  doc.fontSize(8).fillColor('#6b7280')
    .text(`Report Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.text('This is a system-generated report', { align: 'center' });
}

// Helper functions for PDF generation
function addSectionHeader(doc, title) {
  doc.fontSize(14).font('Helvetica-Bold')
    .fillColor('#1f2937')
    .text(title);
  doc.moveDown(0.3);
  doc.strokeColor('#3b82f6')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .stroke();
  doc.moveDown();
  doc.fillColor('#000000');
}

function addSubSectionHeader(doc, title) {
  doc.fontSize(12).font('Helvetica-Bold')
    .fillColor('#374151')
    .text(title);
  doc.moveDown(0.5);
}

function addKeyValue(doc, key, value) {
  doc.fontSize(10).font('Helvetica-Bold')
    .fillColor('#374151')
    .text(`${key}: `, 50, doc.y, { continued: true })
    .font('Helvetica')
    .fillColor('#000000')
    .text(value || 'N/A');
  doc.moveDown(0.3);
}

function calculateAttendanceSummary(attendance) {
  return {
    totalDays: attendance.length,
    present: attendance.filter(a => a.status === 'Present').length,
    absent: attendance.filter(a => a.status === 'Absent').length,
    halfDay: attendance.filter(a => a.status === 'Half Day').length,
    leave: attendance.filter(a => a.status === 'Leave').length,
    totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0),
    averageWorkingHours: attendance.length > 0 
      ? (attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0) / attendance.length).toFixed(2)
      : '0'
  };
}

function calculateTaskSummary(tasks) {
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    ongoing: tasks.filter(t => t.status === 'Ongoing').length,
    assigned: tasks.filter(t => t.status === 'Assigned').length,
    totalTimeSpent: tasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0),
    completionRate: tasks.length > 0 ? ((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100).toFixed(1) : '0'
  };
}

function calculateVisitSummary(visits) {
  return {
    total: visits.length,
    approved: visits.filter(v => v.approvalStatus === 'Approved').length,
    pending: visits.filter(v => v.approvalStatus === 'Pending').length,
    rejected: visits.filter(v => v.approvalStatus === 'Rejected').length
  };
}

function calculateMeetingSummary(meetings) {
  const totalParticipants = meetings.reduce((sum, m) => sum + (m.numberOfParticipants || 0), 0);
  return {
    total: meetings.length,
    totalParticipants,
    averageParticipants: meetings.length > 0 ? (totalParticipants / meetings.length).toFixed(1) : '0'
  };
}

// Staff performance report
exports.getStaffPerformanceReport = async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;

    if (!staffId || !startDate || !endDate) {
      return res.status(400).json({ message: "staffId, startDate, and endDate are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Attendance summary
    const attendance = await Attendance.find({
      staff: staffId,
      date: { $gte: start, $lte: end }
    });

    const attendanceSummary = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      halfDay: attendance.filter(a => a.status === 'Half Day').length,
      leave: attendance.filter(a => a.status === 'Leave').length,
      totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0),
      averageWorkingHours: attendance.length > 0 
        ? (attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0) / attendance.length).toFixed(2)
        : 0
    };

    // Task summary
    const tasks = await StaffTask.find({
      assignedTo: staffId,
      startDate: { $gte: start, $lte: end }
    });

    const taskSummary = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      ongoing: tasks.filter(t => t.status === 'Ongoing').length,
      pending: tasks.filter(t => t.status === 'Assigned').length,
      totalTimeSpent: tasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0)
    };

    // Field visits summary
    const visits = await FieldVisit.find({
      staff: staffId,
      visitDate: { $gte: start, $lte: end }
    });

    const visitSummary = {
      total: visits.length,
      byPurpose: {
        survey: visits.filter(v => v.purpose === 'Survey').length,
        meeting: visits.filter(v => v.purpose === 'Meeting').length,
        monitoring: visits.filter(v => v.purpose === 'Monitoring').length,
        awareness: visits.filter(v => v.purpose === 'Awareness').length,
        training: visits.filter(v => v.purpose === 'Training').length,
        other: visits.filter(v => v.purpose === 'Other').length
      }
    };

    // Meetings summary
    const meetings = await VillageMeeting.find({
      conductedBy: staffId,
      meetingDate: { $gte: start, $lte: end }
    });

    const meetingSummary = {
      total: meetings.length,
      totalParticipants: meetings.reduce((sum, m) => sum + (m.numberOfParticipants || 0), 0)
    };

    // Daily reports summary
    const reports = await DailyWorkReport.find({
      staff: staffId,
      date: { $gte: start, $lte: end }
    });

    const reportSummary = {
      submitted: reports.length,
      reviewed: reports.filter(r => r.supervisorReviewedBy).length
    };

    const staff = await Staff.findById(staffId).populate('user', 'name email');

    res.json({
      staff,
      period: { startDate, endDate },
      attendance: attendanceSummary,
      tasks: taskSummary,
      visits: visitSummary,
      meetings: meetingSummary,
      reports: reportSummary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Consolidated activity summary
exports.getActivitySummary = async (req, res) => {
  try {
    const { startDate, endDate, department, project } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const staffFilter = { isActive: true };
    if (department) staffFilter.department = department;
    if (project) staffFilter.project = project;

    const allStaff = await Staff.find(staffFilter);
    const staffIds = allStaff.map(s => s._id);

    // Overall attendance
    const attendance = await Attendance.find({
      staff: { $in: staffIds },
      date: { $gte: start, $lte: end }
    });

    // Overall tasks
    const tasks = await StaffTask.find({
      assignedTo: { $in: staffIds },
      startDate: { $gte: start, $lte: end }
    });

    // Overall visits
    const visits = await FieldVisit.find({
      staff: { $in: staffIds },
      visitDate: { $gte: start, $lte: end }
    });

    // Overall meetings
    const meetings = await VillageMeeting.find({
      conductedBy: { $in: staffIds },
      meetingDate: { $gte: start, $lte: end }
    });

    const summary = {
      totalStaff: allStaff.length,
      attendance: {
        totalRecords: attendance.length,
        present: attendance.filter(a => a.status === 'Present').length,
        totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0)
      },
      tasks: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'Completed').length,
        ongoing: tasks.filter(t => t.status === 'Ongoing').length
      },
      visits: {
        total: visits.length,
        approved: visits.filter(v => v.approvalStatus === 'Approved').length
      },
      meetings: {
        total: meetings.length,
        totalParticipants: meetings.reduce((sum, m) => sum + (m.numberOfParticipants || 0), 0)
      }
    };

    res.json({ summary, period: { startDate: start, endDate: end } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Village-wise activity report
exports.getVillageActivityReport = async (req, res) => {
  try {
    const { villageId, startDate, endDate } = req.query;

    if (!villageId) {
      return res.status(400).json({ message: "villageId is required" });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Field visits
    const visits = await FieldVisit.find({
      village: villageId,
      visitDate: { $gte: start, $lte: end }
    }).populate('staff', 'name employeeId');

    // Meetings
    const meetings = await VillageMeeting.find({
      village: villageId,
      meetingDate: { $gte: start, $lte: end }
    }).populate('conductedBy', 'name employeeId');

    // Tasks related to village
    const tasks = await StaffTask.find({
      village: villageId,
      startDate: { $gte: start, $lte: end }
    }).populate('assignedTo', 'name employeeId');

    res.json({
      villageId,
      period: { startDate: start, endDate: end },
      visits: {
        total: visits.length,
        data: visits
      },
      meetings: {
        total: meetings.length,
        totalParticipants: meetings.reduce((sum, m) => sum + (m.numberOfParticipants || 0), 0),
        data: meetings
      },
      tasks: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'Completed').length,
        data: tasks
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Monthly attendance report
exports.getMonthlyAttendanceReport = async (req, res) => {
  try {
    const { month, year, department } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "month and year are required" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const staffFilter = { isActive: true };
    if (department) staffFilter.department = department;

    const allStaff = await Staff.find(staffFilter).populate('user', 'name');

    const report = await Promise.all(allStaff.map(async (staff) => {
      const attendance = await Attendance.find({
        staff: staff._id,
        date: { $gte: startDate, $lte: endDate }
      });

      return {
        staff: {
          id: staff._id,
          name: staff.name,
          employeeId: staff.employeeId,
          department: staff.department
        },
        attendance: {
          present: attendance.filter(a => a.status === 'Present').length,
          absent: attendance.filter(a => a.status === 'Absent').length,
          halfDay: attendance.filter(a => a.status === 'Half Day').length,
          leave: attendance.filter(a => a.status === 'Leave').length,
          totalWorkingHours: attendance.reduce((sum, a) => sum + (a.workingHours || 0), 0)
        }
      };
    }));

    res.json({ 
      month, 
      year, 
      department: department || 'All',
      report 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Task completion report
exports.getTaskCompletionReport = async (req, res) => {
  try {
    const { startDate, endDate, department, priority } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const staffFilter = { isActive: true };
    if (department) staffFilter.department = department;

    const allStaff = await Staff.find(staffFilter);
    const staffIds = allStaff.map(s => s._id);

    const taskFilter = {
      assignedTo: { $in: staffIds },
      startDate: { $gte: start, $lte: end }
    };
    if (priority) taskFilter.priority = priority;

    const tasks = await StaffTask.find(taskFilter)
      .populate('assignedTo', 'name employeeId department')
      .populate('village', 'name');

    const report = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      ongoing: tasks.filter(t => t.status === 'Ongoing').length,
      pending: tasks.filter(t => t.status === 'Assigned').length,
      onHold: tasks.filter(t => t.status === 'On Hold').length,
      cancelled: tasks.filter(t => t.status === 'Cancelled').length,
      completionRate: tasks.length > 0 
        ? ((tasks.filter(t => t.status === 'Completed').length / tasks.length) * 100).toFixed(2) + '%'
        : '0%',
      byPriority: {
        low: tasks.filter(t => t.priority === 'Low').length,
        medium: tasks.filter(t => t.priority === 'Medium').length,
        high: tasks.filter(t => t.priority === 'High').length,
        urgent: tasks.filter(t => t.priority === 'Urgent').length
      },
      tasks
    };

    res.json({ report, period: { startDate: start, endDate: end } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
