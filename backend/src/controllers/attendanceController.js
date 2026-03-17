const Attendance = require("../models/Attendance");
const Staff = require("../models/Staff");

// Check-in
exports.checkIn = async (req, res) => {
  try {
    const { latitude, longitude, address, photo } = req.body;
    
    // Get staff profile
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      staff: staff._id,
      date: { $gte: today }
    });

    if (existingAttendance && existingAttendance.checkInTime) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    const attendance = existingAttendance || new Attendance({
      staff: staff._id,
      date: new Date()
    });

    attendance.checkInTime = new Date();
    attendance.checkInLocation = { latitude, longitude, address };
    attendance.checkInPhoto = photo;
    attendance.status = "Present";
    
    await attendance.save();

    res.json({ 
      message: "Checked in successfully", 
      attendance: await attendance.populate('staff', 'name employeeId')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check-out
exports.checkOut = async (req, res) => {
  try {
    const { latitude, longitude, address, photo, remarks } = req.body;
    
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      staff: staff._id,
      date: { $gte: today }
    });

    if (!attendance || !attendance.checkInTime) {
      return res.status(400).json({ message: "Please check in first" });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({ message: "Already checked out today" });
    }

    attendance.checkOutTime = new Date();
    attendance.checkOutLocation = { latitude, longitude, address };
    attendance.checkOutPhoto = photo;
    attendance.remarks = remarks;
    
    // Calculate working hours
    const workingHours = (attendance.checkOutTime - attendance.checkInTime) / (1000 * 60 * 60);
    attendance.workingHours = Math.round(workingHours * 100) / 100;
    
    await attendance.save();

    res.json({ 
      message: "Checked out successfully", 
      attendance: await attendance.populate('staff', 'name employeeId')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get today's attendance status
exports.getTodayAttendance = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      staff: staff._id,
      date: { $gte: today }
    }).populate('staff', 'name employeeId department');

    res.json({ attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get attendance history
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { startDate, endDate, staffId } = req.query;
    
    let staff;
    if (staffId && (req.user.role === 'admin' || req.user.role === 'supervisor')) {
      staff = await Staff.findById(staffId);
    } else {
      staff = await Staff.findOne({ user: req.user._id });
    }

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

    const attendance = await Attendance.find(filter)
      .populate('staff', 'name employeeId department')
      .populate('approvedBy', 'name')
      .sort({ date: -1 });

    res.json({ attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get live staff presence (Admin/Supervisor)
exports.getLivePresence = async (req, res) => {
  try {
    const { date, department, project } = req.query;
    
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const staffFilter = { isActive: true };
    if (department) staffFilter.department = department;
    if (project) staffFilter.project = project;

    const allStaff = await Staff.find(staffFilter);
    const staffIds = allStaff.map(s => s._id);

    const attendance = await Attendance.find({
      staff: { $in: staffIds },
      date: { $gte: targetDate }
    }).populate('staff', 'name employeeId department project');

    const summary = {
      total: allStaff.length,
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      halfDay: attendance.filter(a => a.status === 'Half Day').length,
      leave: attendance.filter(a => a.status === 'Leave').length,
      pending: allStaff.length - attendance.length
    };

    res.json({ summary, attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve/Reject attendance
exports.approveAttendance = async (req, res) => {
  try {
    const { approvalStatus, approvalRemarks } = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus,
        approvalRemarks,
        approvedBy: req.user._id,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('staff approvedBy');

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    res.json({ message: "Attendance updated successfully", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark leave/absence
exports.markLeave = async (req, res) => {
  try {
    const { date, status, remarks } = req.body;
    
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const attendance = await Attendance.create({
      staff: staff._id,
      date: new Date(date),
      status,
      remarks,
      approvalStatus: "Pending"
    });

    res.json({ message: "Leave marked successfully", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
