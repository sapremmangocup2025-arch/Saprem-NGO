// Quick fix script for staff task issues
// Run with: node fix-staff-tasks.js

const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixStaffTasks = async () => {
  await connectDB();

  const User = require('./src/models/User');
  const Staff = require('./src/models/Staff');
  const StaffTask = require('./src/models/StaffTask');

  console.log('🔧 Staff Task Fix Utility\n');
  console.log('This script will help you diagnose and fix staff task issues.\n');

  // Check 1: Find all staff users
  const staffUsers = await User.find({ role: 'staff' });
  console.log(`📊 Found ${staffUsers.length} staff users in the system\n`);

  if (staffUsers.length === 0) {
    console.log('❌ No staff users found. Please create a staff member first.');
    process.exit(0);
  }

  // Check 2: Find staff profiles
  const staffProfiles = await Staff.find();
  console.log(`📊 Found ${staffProfiles.length} staff profiles in the system\n`);

  // Check 3: Find orphaned users (users without staff profiles)
  const orphanedUsers = [];
  for (const user of staffUsers) {
    const profile = await Staff.findOne({ user: user._id });
    if (!profile) {
      orphanedUsers.push(user);
    }
  }

  if (orphanedUsers.length > 0) {
    console.log(`⚠️  Found ${orphanedUsers.length} staff users WITHOUT staff profiles:\n`);
    orphanedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
    });
    console.log('');

    const fix = await question('Do you want to create staff profiles for these users? (yes/no): ');
    
    if (fix.toLowerCase() === 'yes' || fix.toLowerCase() === 'y') {
      for (const user of orphanedUsers) {
        const staffCount = await Staff.countDocuments();
        const employeeId = `EMP${String(staffCount + 1).padStart(4, '0')}`;
        
        const phone = await question(`Enter phone number for ${user.name}: `);
        const department = await question(`Enter department for ${user.name}: `);
        const designation = await question(`Enter designation for ${user.name}: `);
        
        await Staff.create({
          user: user._id,
          employeeId,
          name: user.name,
          email: user.email,
          phone,
          department,
          designation,
          isActive: true,
          joiningDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`✅ Created staff profile for ${user.name} (${employeeId})\n`);
      }
    }
  } else {
    console.log('✅ All staff users have staff profiles\n');
  }

  // Check 4: Find all tasks
  const allTasks = await StaffTask.find()
    .populate('assignedTo', 'name employeeId email')
    .populate('assignedBy', 'name');

  console.log(`📊 Found ${allTasks.length} tasks in the system\n`);

  if (allTasks.length === 0) {
    console.log('ℹ️  No tasks found. Create some tasks from the admin panel.\n');
  } else {
    // Check 5: Find tasks with invalid assignedTo
    const invalidTasks = allTasks.filter(task => !task.assignedTo);
    
    if (invalidTasks.length > 0) {
      console.log(`⚠️  Found ${invalidTasks.length} tasks with invalid assignedTo:\n`);
      invalidTasks.forEach((task, index) => {
        console.log(`   ${index + 1}. ${task.title} (ID: ${task._id})`);
      });
      console.log('');
      
      const deleteTasks = await question('Do you want to delete these invalid tasks? (yes/no): ');
      
      if (deleteTasks.toLowerCase() === 'yes' || deleteTasks.toLowerCase() === 'y') {
        for (const task of invalidTasks) {
          await StaffTask.findByIdAndDelete(task._id);
          console.log(`✅ Deleted task: ${task.title}`);
        }
        console.log('');
      }
    } else {
      console.log('✅ All tasks have valid assignedTo references\n');
    }

    // Check 6: Show task distribution
    console.log('📊 Task Distribution:\n');
    const tasksByStaff = {};
    
    for (const task of allTasks) {
      if (task.assignedTo) {
        const staffName = task.assignedTo.name;
        if (!tasksByStaff[staffName]) {
          tasksByStaff[staffName] = [];
        }
        tasksByStaff[staffName].push(task);
      }
    }

    for (const [staffName, tasks] of Object.entries(tasksByStaff)) {
      console.log(`   ${staffName}: ${tasks.length} tasks`);
      tasks.forEach(task => {
        console.log(`      - ${task.title} (${task.status}, ${task.priority})`);
      });
    }
    console.log('');
  }

  // Check 7: Test a specific staff member
  console.log('🧪 Test Staff Member Login\n');
  const testEmail = await question('Enter staff email to test (or press Enter to skip): ');
  
  if (testEmail) {
    const user = await User.findOne({ email: testEmail });
    if (!user) {
      console.log(`❌ User not found: ${testEmail}\n`);
    } else {
      console.log(`✅ User found: ${user.name} (${user.role})\n`);
      
      const staff = await Staff.findOne({ user: user._id });
      if (!staff) {
        console.log(`❌ Staff profile not found for this user\n`);
      } else {
        console.log(`✅ Staff profile found: ${staff.employeeId} - ${staff.name}\n`);
        
        const tasks = await StaffTask.find({ assignedTo: staff._id })
          .populate('assignedBy', 'name')
          .populate('village', 'name');
        
        console.log(`📋 Tasks assigned to ${staff.name}: ${tasks.length}\n`);
        
        if (tasks.length > 0) {
          tasks.forEach((task, index) => {
            console.log(`   ${index + 1}. ${task.title}`);
            console.log(`      Status: ${task.status}`);
            console.log(`      Priority: ${task.priority}`);
            console.log(`      Assigned by: ${task.assignedBy?.name || 'Unknown'}`);
            console.log(`      Village: ${task.village?.name || 'N/A'}`);
            console.log('');
          });
        } else {
          console.log('   No tasks assigned to this staff member.\n');
        }
      }
    }
  }

  await mongoose.connection.close();
  rl.close();
  console.log('✅ Done!\n');
};

fixStaffTasks().catch(error => {
  console.error('❌ Error:', error);
  rl.close();
  process.exit(1);
});
