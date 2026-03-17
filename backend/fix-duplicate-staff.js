const mongoose = require('mongoose');
const Staff = require('./src/models/Staff');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://sapremmangocup2025_db_user:h5xiSNhW1Sxedzjv@cluster0prem.fbhatto.mongodb.net/saprem?retryWrites=true&w=majority&appName=Cluster0prem');

async function fixDuplicateStaff() {
  try {
    console.log('🔍 Checking for duplicate employee IDs...\n');

    // Find all staff members
    const allStaff = await Staff.find({}).sort({ createdAt: 1 });
    console.log(`📊 Total staff members: ${allStaff.length}\n`);

    // Group by employee ID to find duplicates
    const employeeIdGroups = {};
    allStaff.forEach(staff => {
      if (!employeeIdGroups[staff.employeeId]) {
        employeeIdGroups[staff.employeeId] = [];
      }
      employeeIdGroups[staff.employeeId].push(staff);
    });

    // Find duplicates
    const duplicates = Object.entries(employeeIdGroups).filter(([id, staffList]) => staffList.length > 1);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate employee IDs found');
    } else {
      console.log(`⚠️ Found ${duplicates.length} duplicate employee ID(s):\n`);
      
      for (const [employeeId, staffList] of duplicates) {
        console.log(`🔄 Employee ID: ${employeeId} (${staffList.length} duplicates)`);
        
        // Keep the first one (oldest), remove the rest
        const [keepStaff, ...removeStaff] = staffList;
        console.log(`   ✅ Keeping: ${keepStaff.name} (${keepStaff._id}) - Created: ${keepStaff.createdAt}`);
        
        for (const staff of removeStaff) {
          console.log(`   ❌ Removing: ${staff.name} (${staff._id}) - Created: ${staff.createdAt}`);
          
          // Remove the staff record
          await Staff.findByIdAndDelete(staff._id);
          
          // Also remove the associated user if it exists
          if (staff.user) {
            await User.findByIdAndDelete(staff.user);
            console.log(`   🗑️ Removed associated user: ${staff.user}`);
          }
        }
        console.log('');
      }
    }

    // Now regenerate employee IDs to ensure proper sequence
    console.log('🔄 Regenerating employee ID sequence...\n');
    
    const remainingStaff = await Staff.find({}).sort({ createdAt: 1 });
    
    for (let i = 0; i < remainingStaff.length; i++) {
      const staff = remainingStaff[i];
      const newEmployeeId = `EMP${String(i + 1).padStart(4, '0')}`;
      
      if (staff.employeeId !== newEmployeeId) {
        console.log(`🔄 Updating ${staff.name}: ${staff.employeeId} → ${newEmployeeId}`);
        staff.employeeId = newEmployeeId;
        await staff.save();
      }
    }

    console.log('\n✅ Staff cleanup complete!');
    console.log(`📊 Final staff count: ${remainingStaff.length}`);
    
    // Show final list
    console.log('\n📋 Current staff members:');
    const finalStaff = await Staff.find({}).sort({ employeeId: 1 });
    finalStaff.forEach(staff => {
      console.log(`   ${staff.employeeId}: ${staff.name} (${staff.email})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDuplicateStaff();