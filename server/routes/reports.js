const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const database = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { uploadReportImages, handleMulterError } = require('../config/upload');
const path = require('path');
const fs = require('fs');

// @route   GET /api/reports
// @desc    Get all public reports
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { status, category, city, page = 1, limit = 10 } = req.query;
    
    if (database.fallbackMode) {
      // Local storage mode
      let reports = await database.findLocal('reports', {});
      
      // Apply filters
      if (status) reports = reports.filter(r => r.status === status);
      if (category) reports = reports.filter(r => r.category === category);
      if (city) reports = reports.filter(r => r.location?.city === city);
      
      // Sort by creation date (newest first)
      reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedReports = reports.slice(startIndex, endIndex);
      
      res.json({
        success: true,
        reports: paginatedReports,
        total: reports.length,
        page: parseInt(page),
        pages: Math.ceil(reports.length / limit)
      });
    } else {
      // MongoDB mode
      const query = { isPublic: true };
      if (status) query.status = status;
      if (category) query.category = category;
      if (city) query['location.city'] = city;
      
      const total = await Report.countDocuments(query);
      const reports = await Report.find(query)
        .populate('userId', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      res.json({
        success: true,
        reports,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      });
    }
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    let report;
    if (database.fallbackMode) {
      report = await database.findOneLocal('reports', { _id: id });
    } else {
      report = await Report.findById(id)
        .populate('userId', 'name email avatar')
        .populate('comments.userId', 'name avatar');
      
      // Increment view count
      if (report) {
        report.metadata.viewCount += 1;
        await report.save();
      }
    }
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// @route   POST /api/reports
// @desc    Create new report with optional images
// @access  Private
router.post('/', authenticate, uploadReportImages.array('images', 5), handleMulterError, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Handle uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        images.push({
          url: `/uploads/reports/${file.filename}`,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          uploadedAt: new Date()
        });
      });
    }
    
    const reportData = {
      ...req.body,
      userId,
      images,
      status: 'pending',
      upvotes: [],
      downvotes: [],
      comments: [],
      statusHistory: [{
        status: 'pending',
        changedBy: userId,
        reason: 'Initial submission',
        changedAt: new Date()
      }]
    };
    
    let newReport;
    if (database.fallbackMode) {
      newReport = await database.createLocal('reports', reportData);
      
      // Update user stats
      const users = await database.findLocal('users', { _id: userId });
      if (users.length > 0) {
        const user = users[0];
        user.stats.totalReports += 1;
        user.stats.pendingReports += 1;
        await database.updateLocal('users', { _id: userId }, user);
      }
    } else {
      newReport = await Report.create(reportData);
      
      // Update user stats
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, {
        $inc: { 
          'stats.totalReports': 1,
          'stats.pendingReports': 1
        }
      });
    }
    
    res.status(201).json({
      success: true,
      report: newReport
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({ error: error.message || 'Failed to create report' });
  }
});

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private (owner or admin)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    let report;
    if (database.fallbackMode) {
      report = await database.findOneLocal('reports', { _id: id });
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Check ownership
      if (report.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this report' });
      }
      
      const updated = await database.updateLocal('reports', { _id: id }, {
        ...report,
        ...req.body,
        updatedAt: new Date().toISOString()
      });
      
      if (updated) {
        report = await database.findOneLocal('reports', { _id: id });
      }
    } else {
      report = await Report.findById(id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Check ownership
      if (report.userId.toString() !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this report' });
      }
      
      Object.assign(report, req.body);
      await report.save();
    }
    
    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// @route   POST /api/reports/:id/upvote
// @desc    Toggle upvote on report
// @access  Private
router.post('/:id/upvote', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    let report;
    let added;
    
    if (database.fallbackMode) {
      report = await database.findOneLocal('reports', { _id: id });
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Toggle upvote
      const upvoteIndex = report.upvotes.findIndex(u => u.userId === userId);
      if (upvoteIndex > -1) {
        report.upvotes.splice(upvoteIndex, 1);
        added = false;
      } else {
        report.upvotes.push({ userId, createdAt: new Date().toISOString() });
        added = true;
      }
      
      await database.updateLocal('reports', { _id: id }, report);
    } else {
      report = await Report.findById(id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      added = report.toggleUpvote(userId);
      await report.save();
    }
    
    res.json({
      success: true,
      added,
      upvoteCount: report.upvotes.length
    });
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({ error: 'Failed to update upvote' });
  }
});

// @route   POST /api/reports/:id/comment
// @desc    Add comment to report
// @access  Private
router.post('/:id/comment', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    
    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    let report;
    const comment = {
      userId,
      text,
      createdAt: new Date().toISOString()
    };
    
    if (database.fallbackMode) {
      report = await database.findOneLocal('reports', { _id: id });
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      report.comments = report.comments || [];
      report.comments.push(comment);
      
      await database.updateLocal('reports', { _id: id }, report);
    } else {
      report = await Report.findById(id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      report.comments.push(comment);
      await report.save();
      
      // Populate the new comment's user info
      await report.populate('comments.userId', 'name avatar');
    }
    
    res.json({
      success: true,
      comment: report.comments[report.comments.length - 1]
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private (owner or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (database.fallbackMode) {
      const report = await database.findOneLocal('reports', { _id: id });
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Check ownership
      if (report.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to delete this report' });
      }
      
      await database.deleteLocal('reports', { _id: id });
    } else {
      const report = await Report.findById(id);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      // Check ownership
      if (report.userId.toString() !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to delete this report' });
      }
      
      await report.remove();
    }
    
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

module.exports = router;