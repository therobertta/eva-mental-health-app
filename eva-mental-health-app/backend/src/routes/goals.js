const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { authenticateToken } = require('../utils/auth');

const router = express.Router();

// Create new goal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { goalText, category, targetDate } = req.body;
    
    // Validate input
    if (!goalText || goalText.length < 10) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Goal text must be at least 10 characters long'
        }
      });
    }
    
    const validCategories = [
      'personal_growth', 'relationships', 'career', 
      'health', 'mental_health', 'finances', 'recreation'
    ];
    
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid goal category'
        }
      });
    }
    
    // Create goal
    const goalId = uuidv4();
    const result = await db.query(
      `INSERT INTO goals (id, user_id, goal_text, goal_category, target_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [goalId, userId, goalText, category || 'personal_growth', targetDate || null]
    );
    
    const goal = result.rows[0];
    
    res.status(201).json({
      id: goal.id,
      goalText: goal.goal_text,
      category: goal.goal_category,
      createdDate: goal.created_date,
      targetDate: goal.target_date,
      status: goal.status
    });
    
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({
      error: {
        code: 'GOAL_CREATE_FAILED',
        message: 'Failed to create goal'
      }
    });
  }
});

// Get all goals
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { status, category } = req.query;
    
    let query = 'SELECT * FROM goals WHERE user_id = $1';
    const params = [userId];
    
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    
    if (category) {
      query += status ? ' AND goal_category = $3' : ' AND goal_category = $2';
      params.push(category);
    }
    
    query += ' ORDER BY created_date DESC';
    
    const result = await db.query(query, params);
    
    const goals = result.rows.map(row => ({
      id: row.id,
      goalText: row.goal_text,
      category: row.goal_category,
      createdDate: row.created_date,
      targetDate: row.target_date,
      status: row.status,
      progressNotes: row.progress_notes || []
    }));
    
    res.json({ goals });
    
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({
      error: {
        code: 'GOALS_FETCH_FAILED',
        message: 'Failed to fetch goals'
      }
    });
  }
});

// Update goal status
router.put('/:goalId/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['active', 'completed', 'paused', 'abandoned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status'
        }
      });
    }
    
    const result = await db.query(
      `UPDATE goals 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, goalId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'GOAL_NOT_FOUND',
          message: 'Goal not found'
        }
      });
    }
    
    res.json({
      message: 'Goal status updated successfully',
      goal: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update goal status error:', error);
    res.status(500).json({
      error: {
        code: 'STATUS_UPDATE_FAILED',
        message: 'Failed to update goal status'
      }
    });
  }
});

// Add progress note
router.post('/:goalId/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;
    const { note, progressPercentage } = req.body;
    
    if (!note || note.length < 5) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Progress note must be at least 5 characters'
        }
      });
    }
    
    // Get current progress notes
    const goalResult = await db.query(
      'SELECT progress_notes FROM goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );
    
    if (goalResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'GOAL_NOT_FOUND',
          message: 'Goal not found'
        }
      });
    }
    
    const currentNotes = goalResult.rows[0].progress_notes || [];
    const newNote = {
      id: uuidv4(),
      note,
      progressPercentage: progressPercentage || null,
      timestamp: new Date().toISOString()
    };
    
    currentNotes.push(newNote);
    
    // Update goal with new progress
    await db.query(
      `UPDATE goals 
       SET progress_notes = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3`,
      [JSON.stringify(currentNotes), goalId, userId]
    );
    
    res.status(201).json({
      message: 'Progress note added successfully',
      progressNote: newNote
    });
    
  } catch (error) {
    console.error('Add progress note error:', error);
    res.status(500).json({
      error: {
        code: 'PROGRESS_NOTE_FAILED',
        message: 'Failed to add progress note'
      }
    });
  }
});

// Delete goal
router.delete('/:goalId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { goalId } = req.params;
    
    const result = await db.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [goalId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'GOAL_NOT_FOUND',
          message: 'Goal not found'
        }
      });
    }
    
    res.json({
      message: 'Goal deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({
      error: {
        code: 'GOAL_DELETE_FAILED',
        message: 'Failed to delete goal'
      }
    });
  }
});

module.exports = router;