// Test script to verify staff task assignment flow
// Run with: node test-staff-task-flow.js

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testStaffTaskFlow = async () => {
  await connectDB();

  const User = require('./src/models/User');
  const Staff = require('./src/models/Staff');
  const StaffTask = require('./src/models/StaffTask');

  console.log('\n📊 Testing Staff Task Flow...\n');

  // 1. Find a staff user
  const staffUser = await User.findOne({ role: 'staff' });
  if (!staffUser) {
    console.log('❌ No staff user found. Please create a staff member first.');
    process.exit(1);
  }
  console.log('1️⃣ Found staff user:', {
    userId: staffUser._id,
    name: staffUser.name,
    email: staffUser.email,
    role: staffUser.role
  });

  // 2. Find the corresponding Staff profile
  const staffProfile = await Staff.findOne({ user: staffUser._id });
  if (!staffProfile) {
    console.log('❌ No staff profile found for this user.');
    console.log('   This is the problem! User exists but Staff profile is missing.');
    process.exit(1);
  }
  console.log('2️⃣ Found staff profile:', {
    staffId: staffProfile._id,
    employeeId: staffProfile.employeeId,
    name: staffProfile.name,
    department: staffProfile.department
  });

  // 3. Find tasks assigned to this staff
  const tasks = await StaffTask.find({ assignedTo: staffProfile._id })
    .populate('assignedBy', 'name')
    .populate('village', 'name');
  
  console.log(`3️⃣ Found ${tasks.length} tasks assigned to this staff:`);
  tasks.forEach((task, index) => {
    console.log(`   Task ${index + 1}:`, {
      title: task.title,
      status: task.status,
      priority: task.priority,
      assignedBy: task.assignedBy?.name,
      village: task.village?.name
    });
  });

  // 4. Check all tasks in the system
  const allTasks = await StaffTask.find()
    .populate('assignedTo', 'name employeeId')
    .populate('assignedBy', 'name');
  
  console.log(`\n4️⃣ Total tasks in system: ${allTasks.length}`);
  allTasks.forEach((task, index) => {
    console.log(`   Task ${index + 1}:`, {
      title: task.title,
      assignedTo: task.assignedTo?.name || 'Unknown',
      assignedToId: task.assignedTo?._id,
      status: task.status
    });
  });

  // 5. Check if there's a mismatch
  console.log('\n5️⃣ Checking for mismatches...');
  const mismatchedTasks = allTasks.filter(task => {
    return task.assignedTo && task.assignedTo._id.toString() !== staffProfile._id.toString();
  });
  
  if (mismatchedTasks.length > 0) {
    console.log(`   ⚠️  Found ${mismatchedTasks.length} tasks assigned to other staff members`);
  } else {
    console.log('   ✅ All tasks are correctly assigned');
  }

  await mongoose.connection.close();
  console.log('\n✅ Test complete\n');
};

testStaffTaskFlow().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
