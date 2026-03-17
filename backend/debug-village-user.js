const mongoose = require('mongoose');
const Village = require('./src/models/Village');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://sapremmangocup2025_db_user:h5xiSNhW1Sxedzjv@cluster0prem.fbhatto.mongodb.net/saprem?retryWrites=true&w=majority&appName=Cluster0prem');

async function debugVillageUsers() {
  try {
    console.log('🔍 Checking village-user relationships...\n');

    // Get all villages
    const villages = await Village.find({}).populate('user');
    console.log(`📊 Total villages: ${villages.length}\n`);

    // Get all users with village role
    const villageUsers = await User.find({ role: 'village' });
    console.log(`👥 Total village users: ${villageUsers.length}\n`);

    // Check each village
    for (const village of villages) {
      console.log(`🏘️ Village: ${village.name} (${village._id})`);
      console.log(`   Status: ${village.status}`);
      console.log(`   Stage: ${village.stage}`);
      console.log(`   Workflow: ${village.workflowVersion || 'v1'}`);
      console.log(`   User Reference: ${village.user ? village.user._id || village.user : 'None'}`);
      
      if (village.user) {
        const user = await User.findById(village.user);
        if (user) {
          console.log(`   ✅ User exists: ${user.email}`);
        } else {
          console.log(`   ❌ User reference exists but user not found!`);
        }
      } else {
        console.log(`   ⚠️ No user reference`);
      }
      console.log('');
    }

    // Check for orphaned users
    console.log('🔍 Checking for orphaned village users...\n');
    for (const user of villageUsers) {
      const village = await Village.findById(user.village);
      if (!village) {
        console.log(`❌ Orphaned user: ${user.email} (${user._id}) - village ${user.village} not found`);
      } else if (!village.user || village.user.toString() !== user._id.toString()) {
        console.log(`⚠️ Unlinked user: ${user.email} (${user._id}) - village ${village.name} doesn't reference this user`);
      }
    }

    console.log('\n✅ Debug complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugVillageUsers();