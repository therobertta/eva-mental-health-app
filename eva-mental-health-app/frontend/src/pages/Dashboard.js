import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Chat,
  Assessment,
  Flag,
  TrendingUp,
  Mood,
  CalendarToday,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    recentConversations: [],
    activeGoals: [],
    lastAssessment: null,
    moodTrend: null,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [conversations, goals, assessments] = await Promise.all([
        axios.get('/conversations?limit=3'),
        axios.get('/goals?status=active&limit=3'),
        axios.get('/assessments/life-wheel?limit=1'),
      ]);

      setStats({
        recentConversations: conversations.data.conversations || [],
        activeGoals: goals.data.goals || [],
        lastAssessment: assessments.data.assessments?.[0] || null,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getLifeWheelAverage = () => {
    if (!stats.lastAssessment) return 0;
    return stats.lastAssessment.averageScore || 0;
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        {getWelcomeMessage()}, {user?.name || 'there'}!
      </Typography>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              How can Eva help you today?
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Chat />}
                  onClick={() => navigate('/conversation')}
                  sx={{ py: 2 }}
                >
                  Start Conversation
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Assessment />}
                  onClick={() => navigate('/assessments')}
                  sx={{ py: 2 }}
                >
                  Take Assessment
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Flag />}
                  onClick={() => navigate('/goals')}
                  sx={{ py: 2 }}
                >
                  Review Goals
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Conversations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Conversations</Typography>
                <Chat color="primary" />
              </Box>
              {stats.recentConversations.length > 0 ? (
                stats.recentConversations.map((conv) => (
                  <Box
                    key={conv.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 1,
                      backgroundColor: 'grey.50',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'grey.100' },
                    }}
                    onClick={() => navigate('/conversation')}
                  >
                    <Typography variant="body2" color="primary">
                      {conv.conversationType.replace('_', ' ').charAt(0).toUpperCase() + 
                       conv.conversationType.slice(1).replace('_', ' ')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(conv.startedAt).toLocaleDateString()} - 
                      Framework: {conv.primaryFramework}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No conversations yet. Start one to begin your journey!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Active Goals */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Active Goals</Typography>
                <Flag color="primary" />
              </Box>
              {stats.activeGoals.length > 0 ? (
                stats.activeGoals.map((goal) => (
                  <Box key={goal.id} sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {goal.goalText}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={goal.category.replace('_', ' ')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      {goal.targetDate && (
                        <Typography variant="caption" color="text.secondary">
                          Target: {new Date(goal.targetDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No active goals. Set some to track your progress!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Life Wheel Summary */}
        {stats.lastAssessment && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Life Balance Overview</Typography>
                  <TrendingUp color="primary" />
                </Box>
                <Grid container spacing={2}>
                  {Object.entries(stats.lastAssessment.scores).map(([area, score]) => (
                    <Grid item xs={12} sm={6} md={3} key={area}>
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {area.charAt(0).toUpperCase() + area.slice(1)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={score * 10}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {score}/10
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    Last assessed: {new Date(stats.lastAssessment.date).toLocaleDateString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Mood Check-in Prompt */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  How are you feeling today?
                </Typography>
                <Typography variant="body2">
                  Take a moment to check in with yourself
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Mood />}
                onClick={() => navigate('/assessments')}
                sx={{
                  backgroundColor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'grey.100',
                  },
                }}
              >
                Log Feeling
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;