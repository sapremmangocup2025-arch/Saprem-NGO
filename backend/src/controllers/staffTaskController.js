const StaffTask = require("../models/StaffTask");
const Staff = require("../models/Staff");

// Create task
exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, project, village, priority, startDate, endDate, remarks } = req.body;

    console.log('📝 Creating task:', {
      title,
      assignedTo,
      assignedBy: req.user._id,
      priority,
      status: 'Assigned'
    });

    const task = await StaffTask.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      project,
      village,
      priority,
      startDate,
      endDate,
      remarks
    });

    console.log('✅ Task created successfully:', task._id);

    res.status(201).json({ 
      message: "Task created successfully", 
      task: await task.populate('assignedTo assignedBy')
    });
  } catch (error) {
    console.error('❌ Error creating task:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, startDate, endDate } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const tasks = await StaffTask.find(filter)
      .populate('assignedTo', 'name employeeId department')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my tasks (for staff)
exports.getMyTasks = async (req, res) => {
  try {
    console.log('🔍 getMyTasks called by user:', req.user._id, req.user.email);
    
    const staff = await Staff.findOne({ user: req.user._id });
    if (!staff) {
      console.log('❌ Staff profile not found for user:', req.user._id);
      return res.status(404).json({ message: "Staff profile not found" });
    }

    console.log('✅ Found staff profile:', staff._id, staff.name, staff.employeeId);

    const { status } = req.query;
    const filter = { assignedTo: staff._id };
    if (status) filter.status = status;

    console.log('🔎 Searching for tasks with filter:', filter);

    const tasks = await StaffTask.find(filter)
      .populate('assignedBy', 'name')
      .sort({ priority: -1, startDate: 1 });

    console.log(`📋 Found ${tasks.length} tasks for staff ${staff.name}`);

    res.json({ tasks });
  } catch (error) {
    console.error('❌ Error in getMyTasks:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await StaffTask.findById(req.params.id)
      .populate('assignedTo', 'name employeeId department')
      .populate('assignedBy', 'name');

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const { title, description, priority, status, startDate, endDate, timeSpent, completionRemarks, attachments } = req.body;

    const updateData = {
      title,
      description,
      priority,
      status,
      startDate,
      endDate,
      timeSpent,
      completionRemarks,
      attachments,
      updatedAt: Date.now()
    };

    if (status === 'Completed') {
      updateData.completedDate = new Date();
    }

    const task = await StaffTask.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('assignedTo assignedBy');

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task updated successfully", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, completionRemarks, timeSpent } = req.body;

    const updateData = { status, updatedAt: Date.now() };
    
    if (completionRemarks) updateData.completionRemarks = completionRemarks;
    if (timeSpent) updateData.timeSpent = timeSpent;
    if (status === 'Completed') updateData.completedDate = new Date();

    const task = await StaffTask.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('assignedTo assignedBy');

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task status updated successfully", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await StaffTask.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get task statistics
exports.getTaskStatistics = async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;
    
    const filter = {};
    if (staffId) filter.assignedTo = staffId;
    if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const tasks = await StaffTask.find(filter);

    const statistics = {
      total: tasks.length,
      assigned: tasks.filter(t => t.status === 'Assigned').length,
      ongoing: tasks.filter(t => t.status === 'Ongoing').length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      onHold: tasks.filter(t => t.status === 'On Hold').length,
      cancelled: tasks.filter(t => t.status === 'Cancelled').length,
      byPriority: {
        low: tasks.filter(t => t.priority === 'Low').length,
        medium: tasks.filter(t => t.priority === 'Medium').length,
        high: tasks.filter(t => t.priority === 'High').length,
        urgent: tasks.filter(t => t.priority === 'Urgent').length
      }
    };

    res.json({ statistics });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
