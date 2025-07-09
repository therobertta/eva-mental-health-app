import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  Psychology as PsychologyIcon,
  Favorite as FavoriteIcon,
  ThumbDown as ThumbDownIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const ConversationContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.default
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}));

const MessageBubble = styled(Paper)(({ theme, isUser }) => ({
  padding: theme.spacing(2),
  maxWidth: '70%',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.background.paper,
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2]
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  gap: theme.spacing(1),
  alignItems: 'flex-end'
}));

const TherapeuticConversation = ({ userId }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [therapeuticProfile, setTherapeuticProfile] = useState(null);
  const [currentModality, setCurrentModality] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadTherapeuticProfile();
    loadConversationHistory();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTherapeuticProfile = async () => {
    try {
      const response = await fetch(`/api/assessments/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setTherapeuticProfile(data.profile);
      }
    } catch (error) {
      console.error('Error loading therapeutic profile:', error);
    }
  };

  const loadConversationHistory = async () => {
    try {
      const response = await fetch(`/api/conversations/history/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.conversations.map(conv => ({
          id: conv.id,
          content: conv.content,
          role: conv.role,
          timestamp: conv.created_at,
          therapeuticModality: conv.therapeutic_modality
        })));
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/conversations/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          userId: userId,
          context: {
            emotionalState: detectEmotionalState(inputMessage),
            therapeuticProfile: therapeuticProfile
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now() + 1,
        content: data.response,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        therapeuticModality: data.therapeuticModality,
        suggestedExercises: data.suggestedExercises,
        conversationDepth: data.conversationDepth,
        beliefConfidence: data.beliefConfidence
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentModality(data.therapeuticModality);

      // Update therapeutic profile if confidence is high
      if (data.beliefConfidence > 0.8) {
        loadTherapeuticProfile();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        content: "I'm having trouble responding right now. Please try again in a moment.",
        role: 'assistant',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const detectEmotionalState = (message) => {
    const messageLower = message.toLowerCase();
    const emotions = [];
    
    if (messageLower.includes('anxious') || messageLower.includes('worried') || messageLower.includes('stress')) {
      emotions.push('anxious');
    }
    if (messageLower.includes('sad') || messageLower.includes('depressed') || messageLower.includes('down')) {
      emotions.push('sad');
    }
    if (messageLower.includes('angry') || messageLower.includes('frustrated') || messageLower.includes('mad')) {
      emotions.push('angry');
    }
    if (messageLower.includes('overwhelmed') || messageLower.includes('stressed') || messageLower.includes('pressure')) {
      emotions.push('overwhelmed');
    }
    if (messageLower.includes('happy') || messageLower.includes('excited') || messageLower.includes('good')) {
      emotions.push('positive');
    }
    
    return emotions;
  };

  const handleFeedback = async (messageId, rating) => {
    try {
      await fetch('/api/conversations/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          messageId: messageId,
          rating: rating,
          therapeuticModality: currentModality
        })
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const getModalityColor = (modality) => {
    const colors = {
      'Cognitive Behavioral Therapy': 'primary',
      'Humanistic Therapy': 'success',
      'Mindfulness & Acceptance Therapy': 'info',
      'Psychodynamic Therapy': 'warning',
      'Existential Therapy': 'secondary',
      'Crisis Response': 'error'
    };
    return colors[modality] || 'default';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <ConversationContainer>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <PsychologyIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">Eva - Your Therapeutic Companion</Typography>
            <Typography variant="body2" color="text.secondary">
              {currentModality ? `Using ${currentModality}` : 'Discovering your therapeutic style...'}
            </Typography>
          </Box>
          {therapeuticProfile && (
            <Chip 
              label={`${Math.round(therapeuticProfile.confidence * 100)}% Match`}
              color="success"
              size="small"
            />
          )}
        </Box>
      </Box>

      {/* Messages */}
      <MessagesContainer>
        {messages.length === 0 && !isLoading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <PsychologyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Welcome to Eva
            </Typography>
            <Typography variant="body2" color="text.secondary">
              I'm here to support you with a therapeutic approach that matches your unique perspective.
              <br />
              Start by sharing what's on your mind.
            </Typography>
          </Box>
        )}

        {messages.map((message) => (
          <Box key={message.id}>
            <MessageBubble isUser={message.role === 'user'}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.content}
              </Typography>
              
              {message.role === 'assistant' && !message.isError && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {message.therapeuticModality && (
                    <Chip
                      label={message.therapeuticModality}
                      color={getModalityColor(message.therapeuticModality)}
                      size="small"
                      icon={<PsychologyIcon />}
                    />
                  )}
                  {message.beliefConfidence && (
                    <Chip
                      label={`${Math.round(message.beliefConfidence * 100)}% confidence`}
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Box>
              )}
              
              <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                {formatTimestamp(message.timestamp)}
              </Typography>
            </MessageBubble>

            {/* Feedback buttons for assistant messages */}
            {message.role === 'assistant' && !message.isError && (
              <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'flex-start' }}>
                <Tooltip title="This response was helpful">
                  <IconButton 
                    size="small" 
                    onClick={() => handleFeedback(message.id, 1)}
                    color="success"
                  >
                    <FavoriteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="This response wasn't helpful">
                  <IconButton 
                    size="small" 
                    onClick={() => handleFeedback(message.id, 0)}
                    color="error"
                  >
                    <ThumbDownIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            {/* Suggested exercises */}
            {message.role === 'assistant' && message.suggestedExercises && message.suggestedExercises.length > 0 && (
              <Box sx={{ mt: 1, ml: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Suggested exercises:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {message.suggestedExercises.map((exercise, index) => (
                    <Chip
                      key={index}
                      label={exercise.replace(/_/g, ' ')}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ))}

        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, alignSelf: 'flex-start' }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Eva is thinking...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ alignSelf: 'center' }}>
            {error}
          </Alert>
        )}

        <div ref={messagesEndRef} />
      </MessagesContainer>

      {/* Input */}
      <InputContainer>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Share what's on your mind..."
          variant="outlined"
          disabled={isLoading}
        />
        <Button
          variant="contained"
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
          endIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}
        >
          Send
        </Button>
      </InputContainer>
    </ConversationContainer>
  );
};

export default TherapeuticConversation; 