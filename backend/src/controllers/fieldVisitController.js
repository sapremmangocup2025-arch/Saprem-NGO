const FieldVisit = require("../models/FieldVisit");
const Staff = require("../models/Staff");

// Create field visit
exports.createVisit = async (req, res) => {
  try {
    const { 
      village, visitDate, visitTime, purpose, purposeDetails, 
      workDone, peopleMetCount, peopleMet, location, 
      videos, observations, challenges, recommendations, 
      followUpRequired, followUpDetails 
    } = req.body;

    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    // Handle uploaded photos
    const photos = req.files ? req.files.map(file => file.path) : [];

    const visit = await FieldVisit.create({
      village,
      staff: staff._id,
      visitDate: new Date(visitDate),
      visitTime,
      purpose,
      purposeDetails,
      workDone,
      peopleMetCount,
      peopleMet: peopleMet ? JSON.parse(peopleMet) : [],
      location: location ? JSON.parse(location) : {},
      photos,
      videos: videos ? JSON.parse(videos) : [],
      observations,
      challenges,
      recommendations,
      followUpRequired: followUpRequired === 'true',
      followUpDetails
    });

    res.status(201).json({ 
      message: "Field visit recorded successfully", 
      visit: await visit.populate('staff')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all visits
exports.getAllVisits = async (req, res) => {
  try {
    const { village, purpose, startDate, endDate, approvalStatus } = req.query;
    
    const filter = {};
    if (village) filter.village = village;
    if (purpose) filter.purpose = purpose;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (startDate && endDate) {
      filter.visitDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const visits = await FieldVisit.find(filter)
      .populate('staff', 'name employeeId department')
      .populate('approvedBy', 'name')
      .sort({ visitDate: -1 });

    res.json({ visits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my visits
exports.getMyVisits = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const { startDate, endDate, purpose } = req.query;
    const filter = { staff: staff._id };
    
    if (purpose) filter.purpose = purpose;
    if (startDate && endDate) {
      filter.visitDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const visits = await FieldVisit.find(filter)
      .populate('approvedBy', 'name')
      .sort({ visitDate: -1 });

    res.json({ visits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get visit by ID
exports.getVisitById = async (req, res) => {
  try {
    const visit = await FieldVisit.findById(req.params.id)
      .populate('staff', 'name employeeId department')
      .populate('approvedBy', 'name');

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    res.json({ visit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update visit
exports.updateVisit = async (req, res) => {
  try {
    const { 
      visitDate, visitTime, purpose, purposeDetails, 
      workDone, peopleMetCount, peopleMet, location, 
      videos, observations, challenges, recommendations, 
      followUpRequired, followUpDetails 
    } = req.body;

    // Handle uploaded photos
    const photos = req.files ? req.files.map(file => file.path) : [];

    const updateData = {
      visitDate,
      visitTime,
      purpose,
      purposeDetails,
      workDone,
      peopleMetCount,
      peopleMet: peopleMet ? JSON.parse(peopleMet) : [],
      location: location ? JSON.parse(location) : {},
      videos: videos ? JSON.parse(videos) : [],
      observations,
      challenges,
      recommendations,
      followUpRequired: followUpRequired === 'true',
      followUpDetails,
      updatedAt: Date.now()
    };

    // Only update photos if new ones are uploaded
    if (photos.length > 0) {
      updateData.photos = photos;
    }

    const visit = await FieldVisit.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('staff approvedBy');

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    res.json({ message: "Visit updated successfully", visit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve/Reject visit
exports.approveVisit = async (req, res) => {
  try {
    const { approvalStatus, approvalRemarks } = req.body;

    const visit = await FieldVisit.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus,
        approvalRemarks,
        approvedBy: req.user._id,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('staff approvedBy');

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    res.json({ message: "Visit approval updated successfully", visit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete visit
exports.deleteVisit = async (req, res) => {
  try {
    const visit = await FieldVisit.findByIdAndDelete(req.params.id);

    if (!visit) {
      return res.status(404).json({ message: "Visit not found" });
    }

    res.json({ message: "Visit deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get visits by village
exports.getVisitsByVillage = async (req, res) => {
  try {
    const visits = await FieldVisit.find({ village: req.params.villageId })
      .populate('staff', 'name employeeId')
      .populate('approvedBy', 'name')
      .sort({ visitDate: -1 });

    res.json({ visits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get visit statistics
exports.getVisitStatistics = async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;
    
    const filter = {};
    if (staffId) filter.staff = staffId;
    if (startDate && endDate) {
      filter.visitDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const visits = await FieldVisit.find(filter);

    const statistics = {
      total: visits.length,
      byPurpose: {
        survey: visits.filter(v => v.purpose === 'Survey').length,
        meeting: visits.filter(v => v.purpose === 'Meeting').length,
        monitoring: visits.filter(v => v.purpose === 'Monitoring').length,
        awareness: visits.filter(v => v.purpose === 'Awareness').length,
        training: visits.filter(v => v.purpose === 'Training').length,
        distribution: visits.filter(v => v.purpose === 'Distribution').length,
        other: visits.filter(v => v.purpose === 'Other').length
      },
      followUpRequired: visits.filter(v => v.followUpRequired).length,
      approved: visits.filter(v => v.approvalStatus === 'Approved').length,
      pending: visits.filter(v => v.approvalStatus === 'Pending').length,
      rejected: visits.filter(v => v.approvalStatus === 'Rejected').length
    };

    res.json({ statistics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
