const mongoose = require('mongoose');
const Village = require('./src/models/Village');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://sapremmangocup2025_db_user:h5xiSNhW1Sxedzjv@cluster0prem.fbhatto.mongodb.net/saprem?retryWrites=true&w=majority&appName=Cluster0prem');

async function checkLatestVillage() {
  try {
    console.log('🔍 Checking latest villages...\n');

    // Get the most recent villages (last 5)
    const villages = await Village.find({})
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('user');

    console.log('📊 Latest 5 villages:\n');

    for (const village of villages) {
      console.log(`🏘️ Village: ${village.name}`);
      console.log(`   ID: ${village._id}`);
      console.log(`   Email: ${village.email}`);
      console.log(`   Status: ${village.status}`);
      console.log(`   Stage: ${village.stage}`);
      console.log(`   Workflow: ${village.workflowVersion || 'v1'}`);
      console.log(`   Created: ${village.createdAt}`);
      console.log(`   Updated: ${village.updatedAt}`);
      console.log(`   User Reference: ${village.user ? village.user._id || village.user : 'None'}`);
      
      if (village.user) {
        const user = village.user._id ? village.user : await User.findById(village.user);
        if (user) {
          console.log(`   ✅ User: ${user.email} (${user._id})`);
          console.log(`   👤 User Role: ${user.role}`);
        } else {
          console.log(`   ❌ User reference exists but user not found!`);
        }
      } else {
        console.log(`   ⚠️ No user reference`);
      }
      console.log('   ' + '─'.repeat(50));
    }

    // Also check the most recent users
    console.log('\n👥 Latest 3 village users:\n');
    const users = await User.find({ role: 'village' })
      .sort({ createdAt: -1 })
      .limit(3);

    for (const user of users) {
      console.log(`👤 User: ${user.email} (${user._id})`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Village Ref: ${user.village}`);
      console.log(`   Created: ${user.createdAt}`);
      
      const village = await Village.findById(user.village);
      if (village) {
        console.log(`   🏘️ Village: ${village.name} (${village.status})`);
      } else {
        console.log(`   ❌ Village not found!`);
      }
      console.log('   ' + '─'.repeat(50));
    }

    console.log('\n✅ Check complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkLatestVillage();