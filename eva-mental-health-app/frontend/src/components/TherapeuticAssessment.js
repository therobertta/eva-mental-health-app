import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const AssessmentContainer = styled(Box)(({ theme }) => ({
  maxWidth: 800,
  margin: '0 auto',
  padding: theme.spacing(3)
}));

const QuestionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[3]
}));

const TherapeuticAssessment = ({ userId, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/assessments/questions/therapeutic-preferences');
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      setError('Failed to load assessment questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        value,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/assessments/process-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          answers: Object.values(answers)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process assessment');
      }

      const data = await response.json();
      setResults(data.therapeuticProfile);
      
      if (onComplete) {
        onComplete(data.therapeuticProfile);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setError('Failed to process your assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    const currentAnswer = answers[question.id]?.value;

    switch (question.type) {
      case 'open_ended':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Share your thoughts..."
            variant="outlined"
          />
        );

      case 'multiple_choice':
        return (
          <RadioGroup
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          >
            {question.options.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option}
                control={<Radio />}
                label={option}
                sx={{ mb: 1 }}
              />
            ))}
          </RadioGroup>
        );

      case 'scale':
        return (
          <Box sx={{ px: 2 }}>
            <Slider
              value={currentAnswer ? parseInt(currentAnswer) : 5}
              onChange={(e, value) => handleAnswerChange(question.id, value.toString())}
              min={question.scale.min}
              max={question.scale.max}
              step={1}
              marks={Object.entries(question.scale.labels).map(([value, label]) => ({
                value: parseInt(value),
                label: label
              }))}
              valueLabelDisplay="auto"
              sx={{ mt: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {question.scale.labels[question.scale.min]}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {question.scale.labels[question.scale.max]}
              </Typography>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  const getProgress = () => {
    return ((currentStep + 1) / questions.length) * 100;
  };

  const getModalityDescription = (modality) => {
    const descriptions = {
      'cbt': 'Structured, solution-focused approach that helps identify and change unhelpful thinking patterns',
      'humanistic': 'Growth-oriented approach focused on self-actualization and unconditional positive regard',
      'mindfulness': 'Present-moment focused approach emphasizing acceptance and non-judgmental awareness',
      'psychodynamic': 'Insight-oriented approach exploring unconscious patterns and relationship dynamics',
      'existential': 'Meaning-focused approach exploring purpose, choice, and responsibility'
    };
    return descriptions[modality] || 'Personalized therapeutic approach';
  };

  if (isLoading) {
    return (
      <AssessmentContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </AssessmentContainer>
    );
  }

  if (results) {
    return (
      <AssessmentContainer>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Assessment Complete!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We've discovered your therapeutic preferences and created a personalized profile.
          </Typography>

          <Box sx={{ mt: 4, textAlign: 'left' }}>
            <Typography variant="h6" gutterBottom>
              Your Therapeutic Profile
            </Typography>
            
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <PsychologyIcon color="primary" />
                  <Typography variant="h6">
                    {results.therapeuticPreferences?.primary?.toUpperCase()} Approach
                  </Typography>
                  <Chip 
                    label={`${Math.round(results.confidence * 100)}% Match`}
                    color="success"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {getModalityDescription(results.therapeuticPreferences?.primary)}
                </Typography>
              </CardContent>
            </Card>

            {results.therapeuticPreferences?.communication_style && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Communication Style
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {Object.entries(results.therapeuticPreferences.communication_style).map(([key, value]) => (
                      <Chip
                        key={key}
                        label={`${key}: ${value}`}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {results.therapeuticPreferences?.exercise_preferences && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recommended Exercises
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {results.therapeuticPreferences.exercise_preferences.map((exercise, index) => (
                      <Chip
                        key={index}
                        label={exercise.replace(/_/g, ' ')}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={() => onComplete && onComplete(results)}
            sx={{ mt: 4 }}
          >
            Start Your Therapeutic Journey
          </Button>
        </Paper>
      </AssessmentContainer>
    );
  }

  return (
    <AssessmentContainer>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <PsychologyIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Discover Your Therapeutic Style
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Help us understand your preferences so we can provide the most effective therapeutic support.
          </Typography>
        </Box>

        <LinearProgress 
          variant="determinate" 
          value={getProgress()} 
          sx={{ mb: 3 }}
        />

        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {questions.map((question, index) => (
            <Step key={index}>
              <StepLabel>{`Question ${index + 1}`}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {questions[currentStep] && (
          <QuestionCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {questions[currentStep].question}
              </Typography>
              
              {questions[currentStep].category && (
                <Chip
                  label={questions[currentStep].category.replace(/_/g, ' ')}
                  size="small"
                  sx={{ mb: 2 }}
                />
              )}

              {renderQuestion(questions[currentStep])}
            </CardContent>
          </QuestionCard>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          {currentStep === questions.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(answers).length < questions.length}
              endIcon={isSubmitting ? <CircularProgress size={20} /> : <TrendingUpIcon />}
            >
              {isSubmitting ? 'Processing...' : 'Complete Assessment'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!answers[questions[currentStep]?.id]}
            >
              Next
            </Button>
          )}
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {currentStep + 1} of {questions.length} questions
          </Typography>
        </Box>
      </Paper>
    </AssessmentContainer>
  );
};

export default TherapeuticAssessment; 