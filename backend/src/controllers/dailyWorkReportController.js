const DailyWorkReport = require("../models/DailyWorkReport");
const Staff = require("../models/Staff");

// Create daily work report
exports.createReport = async (req, res) => {
  try {
    const { date, tasksWorkedOn, ongoingActivities, completedTasks, challenges, achievements, planForNextDay } = req.body;

    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    // Check if report already exists for this date
    const existingReport = await DailyWorkReport.findOne({
      staff: staff._id,
      date: new Date(date)
    });

    if (existingReport) {
      return res.status(400).json({ message: "Report already exists for this date" });
    }

    const report = await DailyWorkReport.create({
      staff: staff._id,
      date: new Date(date),
      tasksWorkedOn,
      ongoingActivities,
      completedTasks,
      challenges,
      achievements,
      planForNextDay
    });

    res.status(201).json({ 
      message: "Daily work report submitted successfully", 
      report: await report.populate('staff completedTasks')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update daily work report
exports.updateReport = async (req, res) => {
  try {
    const { tasksWorkedOn, ongoingActivities, completedTasks, challenges, achievements, planForNextDay } = req.body;

    const report = await DailyWorkReport.findByIdAndUpdate(
      req.params.id,
      {
        tasksWorkedOn,
        ongoingActivities,
        completedTasks,
        challenges,
        achievements,
        planForNextDay,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('staff completedTasks');

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({ message: "Report updated successfully", report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my reports
exports.getMyReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const filter = { staff: staff._id };
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const reports = await DailyWorkReport.find(filter)
      .populate('completedTasks')
      .populate('supervisorReviewedBy', 'name')
      .sort({ date: -1 });

    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all reports (Admin/Supervisor)
exports.getAllReports = async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;
    
    const filter = {};
    if (staffId) filter.staff = staffId;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const reports = await DailyWorkReport.find(filter)
      .populate('staff', 'name employeeId department')
      .populate('completedTasks')
      .populate('supervisorReviewedBy', 'name')
      .sort({ date: -1 });

    res.json({ reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get report by ID
exports.getReportById = async (req, res) => {
  try {
    const report = await DailyWorkReport.findById(req.params.id)
      .populate('staff', 'name employeeId department')
      .populate('completedTasks')
      .populate('supervisorReviewedBy', 'name');

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add supervisor comments
exports.addSupervisorComments = async (req, res) => {
  try {
    const { supervisorComments } = req.body;

    const report = await DailyWorkReport.findByIdAndUpdate(
      req.params.id,
      {
        supervisorComments,
        supervisorReviewedBy: req.user._id,
        reviewedAt: new Date(),
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('staff supervisorReviewedBy completedTasks');

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({ message: "Comments added successfully", report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get today's report
exports.getTodayReport = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const report = await DailyWorkReport.findOne({
      staff: staff._id,
      date: { $gte: today }
    }).populate('completedTasks supervisorReviewedBy');

    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
