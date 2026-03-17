const VillageMeeting = require("../models/VillageMeeting");
const Staff = require("../models/Staff");

// Create village meeting
exports.createMeeting = async (req, res) => {
  try {
    const { 
      village, meetingDate, meetingTime, purpose, agenda, 
      numberOfParticipants, participantDetails, 
      minutesOfMeeting, actionPoints, followUpTasks, location 
    } = req.body;

    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    // Handle uploaded photos
    const photos = req.files ? req.files.map(file => file.path) : [];

    const meeting = await VillageMeeting.create({
      village,
      conductedBy: staff._id,
      meetingDate: new Date(meetingDate),
      meetingTime,
      purpose,
      agenda,
      numberOfParticipants,
      participantDetails: participantDetails ? JSON.parse(participantDetails) : [],
      photos,
      minutesOfMeeting,
      actionPoints: actionPoints ? JSON.parse(actionPoints) : [],
      followUpTasks: followUpTasks ? JSON.parse(followUpTasks) : [],
      location: location ? JSON.parse(location) : {}
    });

    res.status(201).json({ 
      message: "Village meeting created successfully", 
      meeting: await meeting.populate('village conductedBy followUpTasks')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all meetings
exports.getAllMeetings = async (req, res) => {
  try {
    const { village, startDate, endDate, approvalStatus } = req.query;
    
    const filter = {};
    if (village) filter.village = village;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (startDate && endDate) {
      filter.meetingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const meetings = await VillageMeeting.find(filter)
      .populate('village', 'name')
      .populate('conductedBy', 'name employeeId department')
      .populate('approvedBy', 'name')
      .populate('followUpTasks')
      .sort({ meetingDate: -1 });

    res.json({ meetings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my meetings
exports.getMyMeetings = async (req, res) => {
  try {
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      return res.status(404).json({ message: "Staff profile not found" });
    }

    const { startDate, endDate } = req.query;
    const filter = { conductedBy: staff._id };
    
    if (startDate && endDate) {
      filter.meetingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const meetings = await VillageMeeting.find(filter)
      .populate('village', 'name')
      .populate('approvedBy', 'name')
      .populate('followUpTasks')
      .sort({ meetingDate: -1 });

    res.json({ meetings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get meeting by ID
exports.getMeetingById = async (req, res) => {
  try {
    const meeting = await VillageMeeting.findById(req.params.id)
      .populate('village', 'name')
      .populate('conductedBy', 'name employeeId department')
      .populate('approvedBy', 'name')
      .populate('followUpTasks');

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json({ meeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update meeting
exports.updateMeeting = async (req, res) => {
  try {
    const { 
      meetingDate, meetingTime, purpose, agenda, 
      numberOfParticipants, participantDetails, 
      minutesOfMeeting, actionPoints, followUpTasks, location 
    } = req.body;

    // Handle uploaded photos
    const photos = req.files ? req.files.map(file => file.path) : [];

    const updateData = {
      meetingDate,
      meetingTime,
      purpose,
      agenda,
      numberOfParticipants,
      participantDetails: participantDetails ? JSON.parse(participantDetails) : [],
      minutesOfMeeting,
      actionPoints: actionPoints ? JSON.parse(actionPoints) : [],
      followUpTasks: followUpTasks ? JSON.parse(followUpTasks) : [],
      location: location ? JSON.parse(location) : {},
      updatedAt: Date.now()
    };

    // Only update photos if new ones are uploaded
    if (photos.length > 0) {
      updateData.photos = photos;
    }

    const meeting = await VillageMeeting.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('village conductedBy approvedBy followUpTasks');

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json({ message: "Meeting updated successfully", meeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve/Reject meeting
exports.approveMeeting = async (req, res) => {
  try {
    const { approvalStatus, approvalRemarks } = req.body;

    const meeting = await VillageMeeting.findByIdAndUpdate(
      req.params.id,
      {
        approvalStatus,
        approvalRemarks,
        approvedBy: req.user._id,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('village conductedBy approvedBy');

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json({ message: "Meeting approval updated successfully", meeting });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete meeting
exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await VillageMeeting.findByIdAndDelete(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.json({ message: "Meeting deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get meetings by village
exports.getMeetingsByVillage = async (req, res) => {
  try {
    const meetings = await VillageMeeting.find({ village: req.params.villageId })
      .populate('conductedBy', 'name employeeId')
      .populate('approvedBy', 'name')
      .sort({ meetingDate: -1 });

    res.json({ meetings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
