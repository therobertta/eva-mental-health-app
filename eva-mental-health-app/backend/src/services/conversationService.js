const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Framework-specific prompts and techniques
const FRAMEWORK_PROMPTS = {
  cognitive_behavioral: {
    systemPrompt: `You are a therapeutic AI companion using Cognitive Behavioral Therapy (CBT) techniques. 
    Focus on the connection between thoughts, feelings, and behaviors. 
    Use Socratic questioning to help users examine their thought patterns.
    Be structured and goal-oriented in your approach.`,
    techniques: ['thought_challenging', 'behavioral_activation', 'cognitive_restructuring', 'problem_solving']
  },
  humanistic: {
    systemPrompt: `You are a therapeutic AI companion using Humanistic/Person-Centered approach. 
    Provide unconditional positive regard and empathetic understanding.
    Focus on the user's inherent capacity for growth and self-actualization.
    Reflect feelings and avoid being directive or giving advice.`,
    techniques: ['empathetic_reflection', 'unconditional_positive_regard', 'authenticity', 'self_exploration']
  },
  mindfulness: {
    systemPrompt: `You are a therapeutic AI companion using Mindfulness-based approaches. 
    Guide users to observe their thoughts and feelings without judgment.
    Focus on present-moment awareness and acceptance.
    Encourage curiosity and non-attachment to thoughts and emotions.`,
    techniques: ['present_moment_awareness', 'acceptance', 'non_judgmental_observation', 'mindful_inquiry']
  },
  psychodynamic: {
    systemPrompt: `You are a therapeutic AI companion using Psychodynamic approaches. 
    Help users explore patterns in their relationships and past experiences.
    Focus on gaining insight into unconscious patterns and defenses.
    Use interpretations carefully and focus on the therapeutic relationship.`,
    techniques: ['pattern_exploration', 'insight_development', 'relationship_analysis', 'defense_identification']
  },
  existential: {
    systemPrompt: `You are a therapeutic AI companion using Existential therapy approaches.
    Help users explore fundamental life questions about meaning, freedom, isolation, and mortality.
    Be authentic and direct about life's challenges while supporting the user's search for purpose.
    Focus on personal responsibility and the freedom to create meaning.`,
    techniques: ['meaning_exploration', 'authenticity_focus', 'freedom_responsibility', 'existential_anxiety_normalization']
  },
  somatic: {
    systemPrompt: `You are a therapeutic AI companion using Somatic/Body-based approaches.
    Guide users to notice and connect with bodily sensations and physical experiences.
    Help them understand how emotions manifest in the body.
    Use body awareness as a pathway to emotional healing.`,
    techniques: ['body_scanning', 'sensation_tracking', 'breath_work', 'grounding_exercises']
  },
  solution_focused: {
    systemPrompt: `You are a therapeutic AI companion using Solution-Focused Brief Therapy (SFBT).
    Focus on solutions rather than problems, and on the user's existing strengths and resources.
    Use scaling questions and miracle questions to help envision positive change.
    Keep conversations brief, goal-oriented, and future-focused.`,
    techniques: ['scaling_questions', 'miracle_question', 'exception_finding', 'strength_identification']
  },
  dialectical_behavioral: {
    systemPrompt: `You are a therapeutic AI companion using Dialectical Behavior Therapy (DBT) techniques.
    Balance acceptance and change, helping users tolerate distress while working toward goals.
    Teach skills in mindfulness, distress tolerance, emotion regulation, and interpersonal effectiveness.
    Validate emotions while encouraging effective behaviors.`,
    techniques: ['radical_acceptance', 'distress_tolerance', 'emotion_regulation', 'interpersonal_effectiveness']
  },
  narrative: {
    systemPrompt: `You are a therapeutic AI companion using Narrative Therapy approaches.
    Help users separate themselves from their problems and reauthor their life stories.
    Externalize problems and explore unique outcomes that contradict problem-saturated narratives.
    Focus on the user's preferred identity and values.`,
    techniques: ['externalization', 'unique_outcomes', 'reauthoring', 'preferred_identity_exploration']
  },
  acceptance_commitment: {
    systemPrompt: `You are a therapeutic AI companion using Acceptance and Commitment Therapy (ACT).
    Help users accept difficult thoughts and feelings while committing to value-based actions.
    Use metaphors and experiential exercises to increase psychological flexibility.
    Focus on workability rather than truth of thoughts.`,
    techniques: ['values_clarification', 'cognitive_defusion', 'experiential_acceptance', 'committed_action']
  }
};

async function generateOpeningMessage(framework, conversationType, currentMood) {
  const frameworkConfig = FRAMEWORK_PROMPTS[framework] || FRAMEWORK_PROMPTS.humanistic;
  
  const moodContext = currentMood ? 
    `The user is feeling ${currentMood.primary_emotion || 'uncertain'} with intensity ${currentMood.intensity || 'moderate'}.` : 
    '';
    
  const conversationContext = {
    exploration: 'The user wants to explore their thoughts and feelings.',
    check_in: 'The user is doing a regular mental health check-in.',
    crisis: 'The user may be in distress and needs immediate support.',
    goal_setting: 'The user wants to work on setting therapeutic goals.'
  };
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `${frameworkConfig.systemPrompt}
          
          You are starting a ${conversationType} conversation. ${moodContext}
          ${conversationContext[conversationType] || ''}
          
          Generate a warm, welcoming opening message appropriate to the framework and situation.
          Keep it under 100 words and invite the user to share.`
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });
    
    const content = response.choices[0].message.content;
    const technique = frameworkConfig.techniques[0];
    
    // Suggest relevant exercises based on framework
    const exercises = getFrameworkExercises(framework, conversationType);
    
    return {
      content,
      technique,
      exercises
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback response
    return {
      content: "I'm here to support you. How are you feeling today, and what would you like to explore together?",
      technique: 'supportive_opening',
      exercises: []
    };
  }
}

async function generateResponse(userMessage, framework, conversationHistory, emotionalState) {
  const frameworkConfig = FRAMEWORK_PROMPTS[framework] || FRAMEWORK_PROMPTS.humanistic;
  
  // Build conversation context
  const historyContext = conversationHistory
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');
    
  const emotionalContext = emotionalState ? 
    `Current emotional state: ${JSON.stringify(emotionalState)}` : 
    '';
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `${frameworkConfig.systemPrompt}
          
          Previous conversation:
          ${historyContext}
          
          ${emotionalContext}
          
          Respond therapeutically to the user's message using ${framework} techniques.
          Be empathetic, supportive, and appropriate to the framework.
          Keep responses under 150 words.
          
          SAFETY: If the user expresses suicidal thoughts or self-harm, express concern and provide crisis resources.`
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });
    
    const content = response.choices[0].message.content;
    
    // Detect which technique was likely used
    const technique = detectTherapeuticTechnique(content, framework);
    
    // Detect mood shifts
    const moodShiftDetected = detectMoodShift(userMessage, emotionalState);
    
    // Get relevant exercises
    const exercises = getRelevantExercises(framework, userMessage, emotionalState);
    
    return {
      content,
      technique,
      exercises,
      moodShiftDetected
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback response
    return {
      content: "I hear you. Can you tell me more about what you're experiencing?",
      technique: 'active_listening',
      exercises: [],
      moodShiftDetected: false
    };
  }
}

function detectTherapeuticTechnique(response, framework) {
  // Simple heuristic-based detection
  const techniques = {
    cognitive_behavioral: {
      'what evidence': 'thought_challenging',
      'what would happen': 'cognitive_restructuring',
      'lets examine': 'socratic_questioning',
      'alternative thought': 'cognitive_reframing'
    },
    humanistic: {
      'sounds like': 'empathetic_reflection',
      'feeling': 'emotional_validation',
      'i hear': 'active_listening',
      'your experience': 'unconditional_positive_regard'
    },
    mindfulness: {
      'notice': 'mindful_observation',
      'present moment': 'present_moment_awareness',
      'without judgment': 'non_judgmental_awareness',
      'observe': 'mindful_inquiry'
    },
    psychodynamic: {
      'pattern': 'pattern_recognition',
      'relationship': 'relationship_exploration',
      'past': 'historical_exploration',
      'defense': 'defense_analysis'
    }
  };
  
  const frameworkTechniques = techniques[framework] || techniques.humanistic;
  const responseLower = response.toLowerCase();
  
  for (const [keyword, technique] of Object.entries(frameworkTechniques)) {
    if (responseLower.includes(keyword)) {
      return technique;
    }
  }
  
  return 'supportive_response';
}

function detectMoodShift(message, emotionalState) {
  // Simple mood shift detection based on keywords and emotional state
  const positiveIndicators = ['better', 'relieved', 'hopeful', 'calmer', 'clearer'];
  const negativeIndicators = ['worse', 'anxious', 'upset', 'frustrated', 'confused'];
  
  const messageLower = message.toLowerCase();
  
  const hasPositive = positiveIndicators.some(word => messageLower.includes(word));
  const hasNegative = negativeIndicators.some(word => messageLower.includes(word));
  
  return hasPositive || hasNegative;
}

function getFrameworkExercises(framework, conversationType) {
  const exercises = {
    cognitive_behavioral: [
      { name: 'Thought Record', duration: 15, description: 'Track and examine your thoughts' },
      { name: 'Behavioral Activation', duration: 20, description: 'Schedule meaningful activities' }
    ],
    humanistic: [
      { name: 'Values Clarification', duration: 20, description: 'Explore your core values' },
      { name: 'Self-Compassion Practice', duration: 10, description: 'Practice self-kindness' }
    ],
    mindfulness: [
      { name: 'Body Scan', duration: 15, description: 'Mindful body awareness' },
      { name: 'Breathing Space', duration: 5, description: 'Quick mindfulness practice' }
    ],
    psychodynamic: [
      { name: 'Relationship Mapping', duration: 25, description: 'Explore relationship patterns' },
      { name: 'Dream Journal', duration: 15, description: 'Record and reflect on dreams' }
    ]
  };
  
  return exercises[framework] || [];
}

function getRelevantExercises(framework, message, emotionalState) {
  // Return exercises based on the content and emotional state
  const exercises = getFrameworkExercises(framework);
  
  // For now, return first two exercises
  // In a real implementation, this would be more sophisticated
  return exercises.slice(0, 2);
}

module.exports = {
  generateOpeningMessage,
  generateResponse
};