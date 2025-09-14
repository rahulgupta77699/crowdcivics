const Report = require('../models/Report');
const User = require('../models/User');

// Get overall platform statistics
exports.getOverallStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalReports,
      pendingReports,
      inProgressReports,
      resolvedReports,
      totalOfficials,
      totalCitizens
    ] = await Promise.all([
      User.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'in-progress' }),
      Report.countDocuments({ status: 'resolved' }),
      User.countDocuments({ role: 'official' }),
      User.countDocuments({ role: 'citizen' })
    ]);

    // Calculate resolution rate
    const resolutionRate = totalReports > 0 
      ? ((resolvedReports / totalReports) * 100).toFixed(2) 
      : 0;

    // Get recent activity
    const recentReports = await Report.find()
      .sort('-createdAt')
      .limit(5)
      .populate('userId', 'name email');

    const recentUsers = await User.find()
      .sort('-createdAt')
      .limit(5)
      .select('name email role createdAt');

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          citizens: totalCitizens,
          officials: totalOfficials
        },
        reports: {
          total: totalReports,
          pending: pendingReports,
          inProgress: inProgressReports,
          resolved: resolvedReports,
          resolutionRate: parseFloat(resolutionRate)
        },
        recentActivity: {
          reports: recentReports,
          users: recentUsers
        }
      }
    });
  } catch (error) {
    console.error('Error fetching overall stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch overall statistics' 
    });
  }
};

// Get reports by category
exports.getReportsByCategory = async (req, res) => {
  try {
    const categoryCounts = await Report.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          avgUpvotes: { $avg: '$upvotes' }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          total: 1,
          pending: 1,
          inProgress: 1,
          resolved: 1,
          avgUpvotes: { $round: ['$avgUpvotes', 2] },
          resolutionRate: {
            $round: [
              { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] },
              2
            ]
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      success: true,
      categories: categoryCounts
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch category statistics' 
    });
  }
};

// Get reports by location
exports.getReportsByLocation = async (req, res) => {
  try {
    const { groupBy = 'city' } = req.query;
    const groupField = groupBy === 'state' ? '$location.state' : '$location.city';

    const locationStats = await Report.aggregate([
      {
        $group: {
          _id: groupField,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          categories: { $addToSet: '$category' }
        }
      },
      {
        $project: {
          _id: 0,
          location: '$_id',
          total: 1,
          pending: 1,
          inProgress: 1,
          resolved: 1,
          categories: 1,
          resolutionRate: {
            $round: [
              { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] },
              2
            ]
          }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      groupBy,
      locations: locationStats
    });
  } catch (error) {
    console.error('Error fetching location stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch location statistics' 
    });
  }
};

// Get time-based analytics
exports.getTimeBasedAnalytics = async (req, res) => {
  try {
    const { period = 'day', days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let dateFormat;
    switch (period) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-W%V';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const timeStats = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          categories: { $addToSet: '$category' },
          avgUpvotes: { $avg: '$upvotes' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          total: 1,
          resolved: 1,
          categories: { $size: '$categories' },
          avgUpvotes: { $round: ['$avgUpvotes', 2] }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Also get user signups over time
    const userSignups = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          signups: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          signups: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      period,
      days,
      reports: timeStats,
      users: userSignups
    });
  } catch (error) {
    console.error('Error fetching time-based analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch time-based analytics' 
    });
  }
};

// Get priority distribution
exports.getPriorityDistribution = async (req, res) => {
  try {
    const priorityStats = await Report.aggregate([
      {
        $group: {
          _id: '$priority',
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'resolved'] },
                { $subtract: ['$resolvedAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          priority: '$_id',
          total: 1,
          pending: 1,
          inProgress: 1,
          resolved: 1,
          avgResolutionTime: {
            $divide: ['$avgResolutionTime', 1000 * 60 * 60 * 24] // Convert to days
          }
        }
      },
      {
        $sort: {
          priority: 1
        }
      }
    ]);

    // Custom sort order for priorities
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    priorityStats.sort((a, b) => 
      (priorityOrder[a.priority] || 999) - (priorityOrder[b.priority] || 999)
    );

    res.json({
      success: true,
      priorities: priorityStats
    });
  } catch (error) {
    console.error('Error fetching priority distribution:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch priority distribution' 
    });
  }
};

// Get engagement metrics
exports.getEngagementMetrics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get active users (users who have created reports or comments)
    const activeUsers = await Report.distinct('userId', {
      createdAt: { $gte: startDate }
    });

    // Get most upvoted reports
    const topReports = await Report.find()
      .sort('-upvotes')
      .limit(10)
      .populate('userId', 'name email')
      .select('title category upvotes status createdAt');

    // Get most active categories
    const activeCategories = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$category',
          reports: { $sum: 1 },
          totalUpvotes: { $sum: '$upvotes' },
          totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          reports: 1,
          totalUpvotes: 1,
          totalComments: 1,
          engagement: { $add: ['$totalUpvotes', '$totalComments'] }
        }
      },
      { $sort: { engagement: -1 } },
      { $limit: 5 }
    ]);

    // Calculate engagement rate
    const totalUsers = await User.countDocuments();
    const engagementRate = totalUsers > 0 
      ? ((activeUsers.length / totalUsers) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      metrics: {
        period: `${days} days`,
        activeUsers: activeUsers.length,
        totalUsers,
        engagementRate: parseFloat(engagementRate),
        topReports,
        activeCategories
      }
    });
  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch engagement metrics' 
    });
  }
};

// Get performance metrics
exports.getPerformanceMetrics = async (req, res) => {
  try {
    // Calculate average resolution time
    const resolutionTimes = await Report.aggregate([
      {
        $match: {
          status: 'resolved',
          resolvedAt: { $exists: true }
        }
      },
      {
        $project: {
          resolutionTime: {
            $subtract: ['$resolvedAt', '$createdAt']
          },
          priority: 1
        }
      },
      {
        $group: {
          _id: '$priority',
          avgTime: { $avg: '$resolutionTime' },
          minTime: { $min: '$resolutionTime' },
          maxTime: { $max: '$resolutionTime' }
        }
      },
      {
        $project: {
          _id: 0,
          priority: '$_id',
          avgTime: { $divide: ['$avgTime', 1000 * 60 * 60 * 24] }, // Convert to days
          minTime: { $divide: ['$minTime', 1000 * 60 * 60 * 24] },
          maxTime: { $divide: ['$maxTime', 1000 * 60 * 60 * 24] }
        }
      }
    ]);

    // Get response times (time to first status change)
    const responseTimes = await Report.aggregate([
      {
        $match: {
          'statusHistory.1': { $exists: true }
        }
      },
      {
        $project: {
          responseTime: {
            $subtract: [
              { $arrayElemAt: ['$statusHistory.changedAt', 1] },
              '$createdAt'
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' }
        }
      },
      {
        $project: {
          _id: 0,
          avgResponseTime: { $divide: ['$avgResponseTime', 1000 * 60 * 60] }, // Convert to hours
          minResponseTime: { $divide: ['$minResponseTime', 1000 * 60 * 60] },
          maxResponseTime: { $divide: ['$maxResponseTime', 1000 * 60 * 60] }
        }
      }
    ]);

    res.json({
      success: true,
      performance: {
        resolutionTimes,
        responseTimes: responseTimes[0] || {
          avgResponseTime: 0,
          minResponseTime: 0,
          maxResponseTime: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch performance metrics' 
    });
  }
};