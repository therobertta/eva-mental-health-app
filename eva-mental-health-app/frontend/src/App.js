import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Paper,
  Tabs,
  Tab,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import {
  Chat as ChatIcon,
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import TherapeuticConversation from './components/TherapeuticConversation';
import TherapeuticAssessment from './components/TherapeuticAssessment';

// Create a therapeutic-themed color palette
const theme = createTheme({
  palette: {
    primary: {
      main: '#6B73FF', // Calming blue-purple
      light: '#9FA8DA',
      dark: '#3F51B5'
    },
    secondary: {
      main: '#FF6B9D', // Warm pink
      light: '#FFB3D1',
      dark: '#E91E63'
    },
    background: {
      default: '#F8F9FF', // Very light blue-tinted background
      paper: '#FFFFFF'
    },
    text: {
      primary: '#2C3E50',
      secondary: '#7F8C8D'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 500
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16
        }
      }
    }
  }
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [userId, setUserId] = useState('user-123'); // In a real app, this would come from auth
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState(false);
  const [therapeuticProfile, setTherapeuticProfile] = useState(null);

  useEffect(() => {
    // Check if user has completed assessment
    checkAssessmentStatus();
  }, [userId]);

  const checkAssessmentStatus = async () => {
    try {
      const response = await fetch(`/api/assessments/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setTherapeuticProfile(data.profile);
        setHasCompletedAssessment(true);
      }
    } catch (error) {
      console.error('Error checking assessment status:', error);
    }
  };

  const handleAssessmentComplete = (profile) => {
    setTherapeuticProfile(profile);
    setHasCompletedAssessment(true);
    setCurrentTab(0); // Switch to conversation tab
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const renderWelcomeScreen = () => (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <PsychologyIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
          Welcome to Eva
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Your AI-powered therapeutic companion that adapts to your unique perspective
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          Eva uses advanced belief modeling to understand your therapeutic preferences and provide 
          personalized mental health support that truly resonates with you.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AssessmentIcon />}
            onClick={() => setCurrentTab(1)}
            sx={{ px: 4, py: 1.5 }}
          >
            Start Assessment
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<ChatIcon />}
            onClick={() => setCurrentTab(0)}
            sx={{ px: 4, py: 1.5 }}
          >
            Skip to Chat
          </Button>
        </Box>

        <Box sx={{ mt: 6, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <PsychologyIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Belief-Aware
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Understands your philosophical framework and therapeutic preferences
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <AssessmentIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Personalized
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Adapts communication style and therapeutic approach to match your needs
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <ChatIcon sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Supportive
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Provides evidence-based therapeutic techniques with genuine empathy
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );

  const renderMainContent = () => {
    if (!hasCompletedAssessment && currentTab === 0) {
      return renderWelcomeScreen();
    }

    switch (currentTab) {
      case 0:
        return <TherapeuticConversation userId={userId} />;
      case 1:
        return <TherapeuticAssessment userId={userId} onComplete={handleAssessmentComplete} />;
      default:
        return <TherapeuticConversation userId={userId} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" elevation={0} sx={{ backgroundColor: 'background.paper' }}>
          <Toolbar>
            <PsychologyIcon sx={{ color: 'primary.main', mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
              Eva Mental Health
            </Typography>
            
            {hasCompletedAssessment && (
              <Tabs 
                value={currentTab} 
                onChange={handleTabChange}
                sx={{ 
                  '& .MuiTab-root': { 
                    color: 'text.secondary',
                    '&.Mui-selected': { color: 'primary.main' }
                  }
                }}
              >
                <Tab 
                  icon={<ChatIcon />} 
                  label="Conversation" 
                  iconPosition="start"
                />
                <Tab 
                  icon={<AssessmentIcon />} 
                  label="Assessment" 
                  iconPosition="start"
                />
              </Tabs>
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ height: 'calc(100vh - 64px)' }}>
          {renderMainContent()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;