import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Send,
  Psychology,
  Warning,
  MoreVert,
  EmojiEmotions,
} from '@mui/icons-material';
import axios from 'axios';

const CONVERSATION_TYPES = [
  { value: 'exploration', label: 'Exploration', description: 'Explore thoughts and feelings' },
  { value: 'check_in', label: 'Check-in', description: 'Regular mental health check-in' },
  { value: 'goal_setting', label: 'Goal Setting', description: 'Work on therapeutic goals' },
];

const FRAMEWORKS = [
  { value: 'cognitive_behavioral', label: 'CBT', description: 'Thought-focused approach' },
  { value: 'humanistic', label: 'Humanistic', description: 'Person-centered approach' },
  { value: 'mindfulness', label: 'Mindfulness', description: 'Present-moment awareness' },
  { value: 'psychodynamic', label: 'Psychodynamic', description: 'Pattern exploration' },
];

const Conversation = () => {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversationType, setConversationType] = useState('exploration');
  const [framework, setFramework] = useState('humanistic');
  const [showSettings, setShowSettings] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startConversation = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/conversations', {
        conversationType,
        preferredFramework: framework,
      });
      
      setConversationId(response.data.conversationId);
      setMessages([{
        role: 'assistant',
        content: response.data.openingMessage,
        timestamp: new Date(),
      }]);
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !conversationId) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setSending(true);

    try {
      const response = await axios.post(`/conversations/${conversationId}/messages`, {
        message: inputMessage,
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        technique: response.data.therapeuticTechnique,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle crisis intervention
      if (response.data.crisisIntervention) {
        setShowCrisisAlert(true);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const endConversation = async () => {
    if (!conversationId) return;

    try {
      await axios.post(`/conversations/${conversationId}/end`);
      setConversationId(null);
      setMessages([]);
      handleMenuClose();
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (!conversationId && !showSettings) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 3 }}>
              Start a New Conversation
            </Typography>
            
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Choose conversation type:
            </Typography>
            <Box sx={{ mb: 3 }}>
              {CONVERSATION_TYPES.map((type) => (
                <Box
                  key={type.value}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: '2px solid',
                    borderColor: conversationType === type.value ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                  onClick={() => setConversationType(type.value)}
                >
                  <Typography variant="subtitle2">{type.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {type.description}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Select therapeutic approach:
            </Typography>
            <Box sx={{ mb: 4 }}>
              {FRAMEWORKS.map((fw) => (
                <Box
                  key={fw.value}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: '2px solid',
                    borderColor: framework === fw.value ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                  onClick={() => setFramework(fw.value)}
                >
                  <Typography variant="subtitle2">{fw.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fw.description}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={startConversation}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Psychology />}
            >
              {loading ? 'Starting...' : 'Start Conversation'}
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {showCrisisAlert && (
        <Alert 
          severity="warning" 
          onClose={() => setShowCrisisAlert(false)}
          sx={{ mb: 2 }}
          icon={<Warning />}
        >
          <Typography variant="subtitle2">Crisis Resources Available</Typography>
          <Typography variant="body2">
            If you're in crisis, please reach out:
            • Crisis Text Line: Text HOME to 741741
            • National Suicide Prevention Lifeline: 988
          </Typography>
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Psychology color="primary" />
          <Typography variant="h6">Eva</Typography>
          <Chip 
            label={framework.replace('_', ' ')} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        </Box>
        <IconButton onClick={handleMenuOpen}>
          <MoreVert />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={endConversation}>End Conversation</MenuItem>
          <MenuItem onClick={handleMenuClose}>View Exercises</MenuItem>
        </Menu>
      </Paper>

      <Paper sx={{ flex: 1, p: 3, overflowY: 'auto', backgroundColor: 'grey.50' }}>
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              mb: 2,
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <Box
              sx={{
                maxWidth: '70%',
                p: 2,
                borderRadius: 2,
                backgroundColor: message.role === 'user' ? 'primary.main' : 'white',
                color: message.role === 'user' ? 'white' : 'text.primary',
                boxShadow: 1,
              }}
            >
              <Typography variant="body1">{message.content}</Typography>
              {message.technique && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
                  Technique: {message.technique.replace('_', ' ')}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
        {sending && (
          <Box display="flex" justifyContent="flex-start" mb={2}>
            <Box sx={{ p: 2 }}>
              <CircularProgress size={20} />
            </Box>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Paper>

      <Paper sx={{ p: 2, mt: 2 }}>
        <Box display="flex" alignItems="flex-end" gap={1}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={sending || !conversationId}
          />
          <IconButton color="primary" disabled>
            <EmojiEmotions />
          </IconButton>
          <IconButton 
            color="primary" 
            onClick={sendMessage}
            disabled={!inputMessage.trim() || sending || !conversationId}
          >
            <Send />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default Conversation;