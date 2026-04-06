const Village = require("../models/Village");
const Staff = require("../models/Staff");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const StaffTask = require("../models/StaffTask");
const FieldVisit = require("../models/FieldVisit");
const VillageMeeting = require("../models/VillageMeeting");
const DailyWorkReport = require("../models/DailyWorkReport");
const VillageActivity = require("../models/VillageActivity");
const VillageSubmission = require("../models/VillageSubmission");
const Competition = require("../models/Competition");

/**
 * Get comprehensive dashboard statistics
 * Provides real-time data for admin dashboard
 */
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Generating dashboard statistics...');

    // Note: baseline_pending villages are excluded from pending count
    // as they don't require admin action - they're waiting for village response

    // Get date ranges for calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // 1. Village Statistics - Only count villages that actually need admin approval
    const totalVillages = await Village.countDocuments();
    const activeVillages = await Village.countDocuments({ status: "active" });
    // Only count NEW applications that need admin action (exclude old baseline_pending)
    const pendingVillages = await Village.countDocuments({ 
      status: { $in: ["applied", "pending_approval"] } 
    });
    const rejectedVillages = await Village.countDocuments({ status: "rejected" });

    // 2. Staff Statistics
    const totalStaff = await Staff.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments();

    // 3. Activity Metrics (Real Data)
    const totalMeetings = await VillageMeeting.countDocuments();
    const totalFieldVisits = await FieldVisit.countDocuments();
    const totalStaffTasks = await StaffTask.countDocuments();
    const completedTasks = await StaffTask.countDocuments({ status: "Completed" });
    const totalDailyReports = await DailyWorkReport.countDocuments();

    // 4. Monthly Activity Metrics
    const monthlyMeetings = await VillageMeeting.countDocuments({
      meetingDate: { $gte: startOfMonth }
    });
    const monthlyFieldVisits = await FieldVisit.countDocuments({
      visitDate: { $gte: startOfMonth }
    });
    const monthlyReports = await DailyWorkReport.countDocuments({
      reportDate: { $gte: startOfMonth }
    });

    // 5. Attendance Statistics
    const todayAttendance = await Attendance.countDocuments({
      date: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      }
    });
    const presentToday = await Attendance.countDocuments({
      date: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      },
      status: "Present"
    });

    // 6. Competition Statistics
    const totalCompetitions = await Competition.countDocuments();
    const activeCompetitions = await Competition.countDocuments({ isActive: true });

    // 7. Village Activities and Submissions
    const totalVillageActivities = await VillageActivity.countDocuments();
    const totalSubmissions = await VillageSubmission.countDocuments();

    // 8. Calculate beneficiaries (sum of village populations)
    const villagesWithBaseline = await Village.find({ baseline: { $exists: true } });
    let totalBeneficiaries = 0;
    if (villagesWithBaseline.length > 0) {
      totalBeneficiaries = villagesWithBaseline.reduce((sum, village) => {
        const baseline = village.baseline;
        if (baseline) {
          // Convert all values to numbers to avoid string concatenation
          const menAbove18 = parseInt(baseline.menAbove18) || 0;
          const womenAbove18 = parseInt(baseline.womenAbove18) || 0;
          const boysBelow18 = parseInt(baseline.boysBelow18) || 0;
          const girlsBelow18 = parseInt(baseline.girlsBelow18) || 0;
          const malePopulation = parseInt(baseline.malePopulation) || 0;
          const femalePopulation = parseInt(baseline.femalePopulation) || 0;
          
          const population = menAbove18 + womenAbove18 + boysBelow18 + girlsBelow18 + malePopulation + femalePopulation;
          return sum + population;
        }
        return sum;
      }, 0);
    }

    // 9. Recent Activity Trends (last 7 days)
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentMeetings = await VillageMeeting.countDocuments({
      meetingDate: { $gte: last7Days }
    }) || 0;
    const recentVisits = await FieldVisit.countDocuments({
      visitDate: { $gte: last7Days }
    }) || 0;
    const recentReports = await DailyWorkReport.countDocuments({
      reportDate: { $gte: last7Days }
    }) || 0;

    // 10. Task Completion Rate
    const taskCompletionRate = totalStaffTasks > 0 ? 
      parseFloat(((completedTasks / totalStaffTasks) * 100).toFixed(1)) : 0;

    // 11. Village Stage Distribution
    const stageDistribution = await Village.aggregate([
      {
        $group: {
          _id: "$stage",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // 12. Monthly Trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthMeetings = await VillageMeeting.countDocuments({
        meetingDate: { $gte: monthStart, $lte: monthEnd }
      });
      const monthVisits = await FieldVisit.countDocuments({
        visitDate: { $gte: monthStart, $lte: monthEnd }
      });
      
      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        meetings: monthMeetings,
        visits: monthVisits
      });
    }

    const dashboardStats = {
      // Village Statistics
      villages: {
        total: totalVillages,
        active: activeVillages,
        pending: pendingVillages,
        rejected: rejectedVillages
      },

      // Staff Statistics
      staff: {
        total: totalStaff,
        presentToday: presentToday,
        attendanceRate: totalStaff > 0 ? parseFloat(((presentToday / totalStaff) * 100).toFixed(1)) : 0
      },

      // Activity Metrics (Dynamic)
      activities: {
        totalMeetings,
        totalFieldVisits,
        totalStaffTasks,
        completedTasks,
        totalDailyReports,
        totalVillageActivities,
        totalSubmissions,
        totalBeneficiaries,
        taskCompletionRate
      },

      // Monthly Activity
      monthly: {
        meetings: monthlyMeetings,
        fieldVisits: monthlyFieldVisits,
        reports: monthlyReports
      },

      // Recent Activity (Last 7 days)
      recent: {
        meetings: recentMeetings,
        visits: recentVisits,
        reports: recentReports
      },

      // Competition Statistics
      competitions: {
        total: totalCompetitions,
        active: activeCompetitions
      },

      // Additional Metrics
      metrics: {
        totalUsers,
        todayAttendance,
        stageDistribution,
        monthlyTrends
      }
    };

    console.log('✅ Dashboard statistics generated successfully');
    res.json(dashboardStats);

  } catch (error) {
    console.error('❌ Error generating dashboard statistics:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get activity summary for specific date range
 */
exports.getActivitySummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const meetings = await VillageMeeting.countDocuments({
      meetingDate: { $gte: start, $lte: end }
    });

    const visits = await FieldVisit.countDocuments({
      visitDate: { $gte: start, $lte: end }
    });

    const reports = await DailyWorkReport.countDocuments({
      reportDate: { $gte: start, $lte: end }
    });

    const tasks = await StaffTask.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    res.json({
      dateRange: { start, end },
      summary: {
        meetings,
        visits,
        reports,
        tasks
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};