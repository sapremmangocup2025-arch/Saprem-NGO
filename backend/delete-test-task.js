// Script to delete the test task "dev-taskMediumAssignedtestig" from all staff
// Run with: node delete-test-task.js

const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const deleteTestTask = async () => {
  await connectDB();

  const StaffTask = require('./src/models/StaffTask');
  const Staff = require('./src/models/Staff'); // Need this for populate to work

  console.log('\n🗑️  Deleting test task "dev-taskMediumAssignedtestig"...\n');

  try {
    // First, let's search for any tasks containing "dev" or "test"
    console.log('🔍 Searching for any tasks containing "dev" or "test"...');
    const allTestTasks = await StaffTask.find({ 
      $or: [
        { title: { $regex: /dev/i } },
        { title: { $regex: /test/i } },
        { title: { $regex: /testig/i } }
      ]
    }).populate('assignedTo', 'name employeeId');

    console.log(`📊 Found ${allTestTasks.length} tasks containing "dev" or "test":`);
    allTestTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. "${task.title}" - ID: ${task._id}`);
      console.log(`      Assigned to: ${task.assignedTo?.name || 'Unknown'} (${task.assignedTo?.employeeId || 'No ID'})`);
      console.log(`      Status: ${task.status}`);
      console.log('');
    });

    // Find all tasks with the specific title
    const testTasks = await StaffTask.find({ 
      title: { $regex: /dev-taskMediumAssignedtestig/i } 
    }).populate('assignedTo', 'name employeeId');

    if (allTestTasks.length === 0) {
      console.log('✅ No test tasks found to delete.');
      await mongoose.connection.close();
      return;
    }

    // Delete the "dev-task" entries that were assigned to all staff
    const deleteResult = await StaffTask.deleteMany({ 
      title: { $regex: /^dev-task$/i } 
    });

    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} "dev-task" instances`);
    console.log('🧹 All staff members have been cleaned up from this test task');

    // Verify deletion
    const remainingDevTasks = await StaffTask.find({ 
      title: { $regex: /^dev-task$/i } 
    });

    if (remainingDevTasks.length === 0) {
      console.log('✅ Verification: No "dev-task" entries remain in the database');
    } else {
      console.log(`⚠️  Warning: ${remainingDevTasks.length} "dev-task" entries still exist`);
    }

  } catch (error) {
    console.error('❌ Error deleting test task:', error);
  }

  await mongoose.connection.close();
  console.log('\n✅ Database connection closed\n');
};

deleteTestTask().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});