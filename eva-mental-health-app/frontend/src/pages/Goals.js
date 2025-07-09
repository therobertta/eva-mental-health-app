import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Flag,
  CheckCircle,
  Pause,
  Delete,
  Edit,
  CalendarToday,
} from '@mui/icons-material';
import axios from 'axios';

const GOAL_CATEGORIES = [
  { value: 'personal_growth', label: 'Personal Growth', color: '#9C27B0' },
  { value: 'relationships', label: 'Relationships', color: '#E91E63' },
  { value: 'career', label: 'Career', color: '#3F51B5' },
  { value: 'health', label: 'Health', color: '#4CAF50' },
  { value: 'mental_health', label: 'Mental Health', color: '#00BCD4' },
  { value: 'finances', label: 'Finances', color: '#FF9800' },
  { value: 'recreation', label: 'Recreation', color: '#795548' },
];

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openProgressDialog, setOpenProgressDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [newGoal, setNewGoal] = useState({
    goalText: '',
    category: 'personal_growth',
    targetDate: '',
  });
  const [progressNote, setProgressNote] = useState({
    note: '',
    progressPercentage: 50,
  });

  useEffect(() => {
    fetchGoals();
  }, [activeTab]);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/goals?status=${activeTab}`);
      setGoals(response.data.goals || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    try {
      await axios.post('/goals', newGoal);
      setOpenDialog(false);
      setNewGoal({ goalText: '', category: 'personal_growth', targetDate: '' });
      fetchGoals();
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  const updateGoalStatus = async (goalId, status) => {
    try {
      await axios.put(`/goals/${goalId}/status`, { status });
      fetchGoals();
      handleMenuClose();
    } catch (error) {
      console.error('Failed to update goal status:', error);
    }
  };

  const addProgressNote = async () => {
    if (!selectedGoal) return;
    
    try {
      await axios.post(`/goals/${selectedGoal.id}/progress`, progressNote);
      setOpenProgressDialog(false);
      setProgressNote({ note: '', progressPercentage: 50 });
      fetchGoals();
    } catch (error) {
      console.error('Failed to add progress note:', error);
    }
  };

  const deleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await axios.delete(`/goals/${goalId}`);
        fetchGoals();
        handleMenuClose();
      } catch (error) {
        console.error('Failed to delete goal:', error);
      }
    }
  };

  const handleMenuOpen = (event, goal) => {
    setAnchorEl(event.currentTarget);
    setSelectedGoal(goal);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedGoal(null);
  };

  const getCategoryDetails = (category) => {
    return GOAL_CATEGORIES.find(c => c.value === category) || GOAL_CATEGORIES[0];
  };

  const getGoalProgress = (goal) => {
    if (!goal.progressNotes || goal.progressNotes.length === 0) return 0;
    const latestProgress = goal.progressNotes[goal.progressNotes.length - 1];
    return latestProgress.progressPercentage || 0;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Goals</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          New Goal
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)}>
          <Tab value="active" label="Active" />
          <Tab value="completed" label="Completed" />
          <Tab value="paused" label="Paused" />
        </Tabs>
      </Paper>

      {loading ? (
        <Typography>Loading goals...</Typography>
      ) : goals.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Flag sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No {activeTab} goals yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Set goals to track your therapeutic progress
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
          >
            Create Your First Goal
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {goals.map((goal) => {
            const category = getCategoryDetails(goal.category);
            const progress = getGoalProgress(goal);
            
            return (
              <Grid item xs={12} md={6} key={goal.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          {goal.goalText}
                        </Typography>
                        <Box display="flex" gap={1} mb={2}>
                          <Chip
                            label={category.label}
                            size="small"
                            sx={{ backgroundColor: category.color, color: 'white' }}
                          />
                          {goal.targetDate && (
                            <Chip
                              icon={<CalendarToday sx={{ fontSize: 16 }} />}
                              label={new Date(goal.targetDate).toLocaleDateString()}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        {activeTab === 'active' && progress > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Box display="flex" justifyContent="space-between" mb={1}>
                              <Typography variant="body2" color="text.secondary">
                                Progress
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {progress}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={progress} 
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        )}
                        {goal.progressNotes && goal.progressNotes.length > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            {goal.progressNotes.length} progress updates
                          </Typography>
                        )}
                      </Box>
                      <IconButton onClick={(e) => handleMenuOpen(e, goal)}>
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </CardContent>
                  {activeTab === 'active' && (
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedGoal(goal);
                          setOpenProgressDialog(true);
                        }}
                      >
                        Add Progress
                      </Button>
                      <Button
                        size="small"
                        color="success"
                        onClick={() => updateGoalStatus(goal.id, 'completed')}
                      >
                        Mark Complete
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Goal Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {activeTab === 'active' && (
          <MenuItem onClick={() => updateGoalStatus(selectedGoal?.id, 'paused')}>
            <Pause sx={{ mr: 1 }} /> Pause Goal
          </MenuItem>
        )}
        {activeTab === 'paused' && (
          <MenuItem onClick={() => updateGoalStatus(selectedGoal?.id, 'active')}>
            <Flag sx={{ mr: 1 }} /> Reactivate Goal
          </MenuItem>
        )}
        <MenuItem onClick={() => deleteGoal(selectedGoal?.id)}>
          <Delete sx={{ mr: 1 }} /> Delete Goal
        </MenuItem>
      </Menu>

      {/* Create Goal Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Goal</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="What do you want to achieve?"
            value={newGoal.goalText}
            onChange={(e) => setNewGoal({ ...newGoal, goalText: e.target.value })}
            multiline
            rows={2}
            sx={{ mb: 2, mt: 1 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
              label="Category"
            >
              {GOAL_CATEGORIES.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Target Date (optional)"
            type="date"
            value={newGoal.targetDate}
            onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={createGoal}
            variant="contained"
            disabled={!newGoal.goalText.trim()}
          >
            Create Goal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Progress Note Dialog */}
      <Dialog open={openProgressDialog} onClose={() => setOpenProgressDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Progress Note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Progress update"
            value={progressNote.note}
            onChange={(e) => setProgressNote({ ...progressNote, note: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 2, mt: 1 }}
          />
          <Typography variant="body2" sx={{ mb: 1 }}>
            Progress: {progressNote.progressPercentage}%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressNote.progressPercentage}
            sx={{ height: 8, borderRadius: 4, mb: 3 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProgressDialog(false)}>Cancel</Button>
          <Button
            onClick={addProgressNote}
            variant="contained"
            disabled={!progressNote.note.trim()}
          >
            Add Progress
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Goals;