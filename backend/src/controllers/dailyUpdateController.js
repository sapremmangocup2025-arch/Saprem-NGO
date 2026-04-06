const DailyUpdate = require("../models/DailyUpdate");
const Staff = require("../models/Staff");

// Create or update daily update
exports.createOrUpdateDailyUpdate = async (req, res) => {
  try {
    const { date, update } = req.body;

    if (!update || !update.trim()) {
      return res.status(400).json({ message: "Update text is required" });
    }

    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const updateDate = new Date(date || new Date());
    updateDate.setHours(0, 0, 0, 0);

    // Check if update already exists for this date
    const existingUpdate = await DailyUpdate.findOne({
      staff: staff._id,
      date: updateDate
    });

    let dailyUpdate;
    if (existingUpdate) {
      // Update existing
      dailyUpdate = await DailyUpdate.findByIdAndUpdate(
        existingUpdate._id,
        { 
          update: update.trim(),
          updatedAt: Date.now()
        },
        { new: true }
      ).populate('staff', 'name employeeId department');
    } else {
      // Create new
      dailyUpdate = await DailyUpdate.create({
        staff: staff._id,
        date: updateDate,
        update: update.trim()
      });
      dailyUpdate = await dailyUpdate.populate('staff', 'name employeeId department');
    }

    res.status(200).json({ 
      message: existingUpdate ? "Daily update updated successfully" : "Daily update created successfully", 
      update: dailyUpdate
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Daily update already exists for this date" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get my daily updates
exports.getMyUpdates = async (req, res) => {
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

    const updates = await DailyUpdate.find(filter)
      .populate('staff', 'name employeeId department')
      .sort({ date: -1 });

    res.json({ updates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get today's update
exports.getTodayUpdate = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const update = await DailyUpdate.findOne({
      staff: staff._id,
      date: { $gte: today }
    }).populate('staff', 'name employeeId department');

    res.json({ update });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all daily updates (Admin)
exports.getAllUpdates = async (req, res) => {
  try {
    const { staffId, startDate, endDate, department } = req.query;
    
    const filter = {};
    
    // Build filter based on query parameters
    if (staffId) {
      filter.staff = staffId;
    }
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let updates = await DailyUpdate.find(filter)
      .populate('staff', 'name employeeId department')
      .sort({ date: -1, createdAt: -1 });

    // Filter by department if specified
    if (department && department !== 'all') {
      updates = updates.filter(update => update.staff?.department === department);
    }

    res.json({ updates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete daily update
exports.deleteDailyUpdate = async (req, res) => {
  try {
    const update = await DailyUpdate.findById(req.params.id);
    
    if (!update) {
      return res.status(404).json({ message: "Daily update not found" });
    }

    // Check if the update belongs to the requesting staff member
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff || update.staff.toString() !== staff._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this update" });
    }

    await DailyUpdate.findByIdAndDelete(req.params.id);
    res.json({ message: "Daily update deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};