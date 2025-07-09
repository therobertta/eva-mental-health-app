import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Slider,
  Button,
  Card,
  CardContent,
  Chip,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from '@mui/material';
import {
  DonutLarge,
  EmojiEmotions,
  TrendingUp,
} from '@mui/icons-material';
import axios from 'axios';

const LIFE_WHEEL_AREAS = [
  { key: 'career', label: 'Career', description: 'Work satisfaction and professional growth' },
  { key: 'relationships', label: 'Relationships', description: 'Quality of personal connections' },
  { key: 'health', label: 'Health', description: 'Physical and mental wellbeing' },
  { key: 'personalGrowth', label: 'Personal Growth', description: 'Learning and self-development' },
  { key: 'finances', label: 'Finances', description: 'Financial security and management' },
  { key: 'recreation', label: 'Recreation', description: 'Fun, hobbies, and relaxation' },
  { key: 'environment', label: 'Environment', description: 'Living and working spaces' },
  { key: 'contribution', label: 'Contribution', description: 'Giving back and making a difference' },
];

const PRIMARY_EMOTIONS = [
  { value: 'joy', label: 'Joy', color: '#FFD700' },
  { value: 'sadness', label: 'Sadness', color: '#4169E1' },
  { value: 'anger', label: 'Anger', color: '#DC143C' },
  { value: 'fear', label: 'Fear', color: '#8B4513' },
  { value: 'surprise', label: 'Surprise', color: '#FF69B4' },
  { value: 'disgust', label: 'Disgust', color: '#228B22' },
];

const Assessments = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [lifeWheelScores, setLifeWheelScores] = useState({
    career: 5,
    relationships: 5,
    health: 5,
    personalGrowth: 5,
    finances: 5,
    recreation: 5,
    environment: 5,
    contribution: 5,
  });
  const [priorityAreas, setPriorityAreas] = useState([]);
  const [feelingsData, setFeelingsData] = useState({
    primaryEmotion: '',
    secondaryEmotion: '',
    intensity: 5,
    trigger: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setResults(null);
  };

  const handleLifeWheelChange = (area, value) => {
    setLifeWheelScores({
      ...lifeWheelScores,
      [area]: value,
    });
  };

  const togglePriorityArea = (area) => {
    if (priorityAreas.includes(area)) {
      setPriorityAreas(priorityAreas.filter(a => a !== area));
    } else if (priorityAreas.length < 3) {
      setPriorityAreas([...priorityAreas, area]);
    }
  };

  const submitLifeWheel = async () => {
    if (priorityAreas.length === 0) {
      alert('Please select at least one priority area');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post('/assessments/life-wheel', {
        scores: lifeWheelScores,
        priorityAreas,
      });
      
      setResults(response.data);
    } catch (error) {
      console.error('Failed to submit life wheel:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const submitFeelings = async () => {
    if (!feelingsData.primaryEmotion) {
      alert('Please select a primary emotion');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post('/assessments/feelings', feelingsData);
      setResults(response.data);
    } catch (error) {
      console.error('Failed to submit feelings:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getAverageScore = () => {
    const scores = Object.values(lifeWheelScores);
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Assessments
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<DonutLarge />} label="Life Wheel" />
          <Tab icon={<EmojiEmotions />} label="Feelings Check-in" />
        </Tabs>

        {/* Life Wheel Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Life Balance Assessment
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Rate each area of your life from 1 (needs significant improvement) to 10 (highly satisfied).
              Then select up to 3 priority areas to focus on.
            </Typography>

            <Grid container spacing={3}>
              {LIFE_WHEEL_AREAS.map((area) => (
                <Grid item xs={12} md={6} key={area.key}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      p: 2,
                      border: priorityAreas.includes(area.key) ? '2px solid' : '1px solid',
                      borderColor: priorityAreas.includes(area.key) ? 'primary.main' : 'grey.300',
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      {area.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      {area.description}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="body2" sx={{ minWidth: 20 }}>
                        {lifeWheelScores[area.key]}
                      </Typography>
                      <Slider
                        value={lifeWheelScores[area.key]}
                        onChange={(e, value) => handleLifeWheelChange(area.key, value)}
                        min={1}
                        max={10}
                        marks
                        sx={{ flex: 1 }}
                      />
                    </Box>
                    <Button
                      size="small"
                      variant={priorityAreas.includes(area.key) ? 'contained' : 'outlined'}
                      onClick={() => togglePriorityArea(area.key)}
                      disabled={!priorityAreas.includes(area.key) && priorityAreas.length >= 3}
                      sx={{ mt: 1 }}
                    >
                      {priorityAreas.includes(area.key) ? 'Priority Area' : 'Set as Priority'}
                    </Button>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 4, p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Assessment Summary
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip 
                  icon={<TrendingUp />} 
                  label={`Average Score: ${getAverageScore()}/10`} 
                  color="primary" 
                />
                <Chip 
                  label={`${priorityAreas.length} Priority Areas Selected`} 
                  color={priorityAreas.length > 0 ? 'secondary' : 'default'} 
                />
              </Box>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={submitLifeWheel}
              disabled={submitting || priorityAreas.length === 0}
              sx={{ mt: 3 }}
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>

            {results && (
              <Alert severity="success" sx={{ mt: 3 }}>
                <Typography variant="subtitle2">Assessment Submitted!</Typography>
                <Box sx={{ mt: 2 }}>
                  {results.insights?.map((insight, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                      • {insight}
                    </Typography>
                  ))}
                </Box>
              </Alert>
            )}
          </Box>
        )}

        {/* Feelings Check-in Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              How are you feeling?
            </Typography>

            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Primary Emotion
            </Typography>
            <RadioGroup
              value={feelingsData.primaryEmotion}
              onChange={(e) => setFeelingsData({ ...feelingsData, primaryEmotion: e.target.value })}
            >
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {PRIMARY_EMOTIONS.map((emotion) => (
                  <Grid item xs={6} sm={4} key={emotion.value}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: feelingsData.primaryEmotion === emotion.value ? '2px solid' : '1px solid',
                        borderColor: feelingsData.primaryEmotion === emotion.value ? emotion.color : 'grey.300',
                        '&:hover': { borderColor: emotion.color },
                      }}
                      onClick={() => setFeelingsData({ ...feelingsData, primaryEmotion: emotion.value })}
                    >
                      <FormControlLabel
                        value={emotion.value}
                        control={<Radio sx={{ display: 'none' }} />}
                        label={
                          <Box textAlign="center">
                            <Typography variant="h3" sx={{ color: emotion.color }}>
                              {emotion.label === 'Joy' && '😊'}
                              {emotion.label === 'Sadness' && '😢'}
                              {emotion.label === 'Anger' && '😠'}
                              {emotion.label === 'Fear' && '😨'}
                              {emotion.label === 'Surprise' && '😮'}
                              {emotion.label === 'Disgust' && '🤢'}
                            </Typography>
                            <Typography variant="body2">{emotion.label}</Typography>
                          </Box>
                        }
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>

            <TextField
              fullWidth
              label="More specific feeling (optional)"
              value={feelingsData.secondaryEmotion}
              onChange={(e) => setFeelingsData({ ...feelingsData, secondaryEmotion: e.target.value })}
              placeholder="e.g., frustrated, overwhelmed, content..."
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Intensity
            </Typography>
            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 3 }}>
              <Typography variant="body2">Low</Typography>
              <Slider
                value={feelingsData.intensity}
                onChange={(e, value) => setFeelingsData({ ...feelingsData, intensity: value })}
                min={1}
                max={10}
                marks
                sx={{ flex: 1 }}
              />
              <Typography variant="body2">High</Typography>
              <Chip label={feelingsData.intensity} color="primary" />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="What triggered this feeling? (optional)"
              value={feelingsData.trigger}
              onChange={(e) => setFeelingsData({ ...feelingsData, trigger: e.target.value })}
              sx={{ mb: 3 }}
            />

            <Button
              variant="contained"
              size="large"
              onClick={submitFeelings}
              disabled={submitting || !feelingsData.primaryEmotion}
            >
              {submitting ? 'Submitting...' : 'Log Feeling'}
            </Button>

            {results && (
              <Alert severity="success" sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Feeling Logged Successfully
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {results.therapeuticGuidance}
                </Typography>
                {results.copingSuggestions && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Coping Suggestions:
                    </Typography>
                    {results.copingSuggestions.map((suggestion, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                        • {suggestion}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Alert>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Assessments;