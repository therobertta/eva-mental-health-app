const OpenAI = require('openai');
const BeliefModelingService = require('./beliefModelingService');

/**
 * Therapeutic Conversation Service for Eva
 * Handles belief-aware conversation routing and therapeutic modality adaptation
 */
class TherapeuticConversationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.beliefModelingService = new BeliefModelingService();
    
    // Therapeutic modality configurations
    this.therapeuticModalities = {
      cbt: {
        name: 'Cognitive Behavioral Therapy',
        description: 'Structured, solution-focused approach that helps identify and change unhelpful thinking patterns',
        systemPrompt: `You are a CBT-focused therapeutic assistant. Your approach is:
        - Structured and goal-oriented
        - Focus on identifying cognitive distortions and behavioral patterns
        - Solution-focused with practical strategies
        - Direct but warm in communication
        - Help users develop coping skills and thought awareness
        
        Always maintain professional boundaries and refer to crisis resources if needed.`,
        exercises: ['thought_records', 'behavioral_experiments', 'cognitive_restructuring', 'exposure_therapy'],
        communicationStyle: {
          directness: 'high',
          warmth: 'moderate',
          structure: 'high',
          pace: 'moderate'
        }
      },
      humanistic: {
        name: 'Humanistic Therapy',
        description: 'Growth-oriented approach focused on self-actualization and unconditional positive regard',
        systemPrompt: `You are a humanistic therapeutic assistant. Your approach is:
        - Growth-oriented and non-directive
        - Focus on self-actualization and personal potential
        - Unconditional positive regard and empathy
        - Warm, reflective, and non-judgmental
        - Help users discover their authentic selves and values
        
        Always maintain professional boundaries and refer to crisis resources if needed.`,
        exercises: ['values_clarification', 'self_compassion_practices', 'authenticity_exploration', 'growth_mindset_work'],
        communicationStyle: {
          directness: 'low',
          warmth: 'very_high',
          structure: 'low',
          pace: 'gradual'
        }
      },
      mindfulness: {
        name: 'Mindfulness & Acceptance Therapy',
        description: 'Present-moment focused approach emphasizing acceptance and non-judgmental awareness',
        systemPrompt: `You are a mindfulness-focused therapeutic assistant. Your approach is:
        - Present-moment awareness and acceptance
        - Non-judgmental observation of thoughts and feelings
        - Gentle guidance toward mindful awareness
        - Calm, slow-paced, and contemplative
        - Help users develop acceptance and mindful presence
        
        Always maintain professional boundaries and refer to crisis resources if needed.`,
        exercises: ['meditation', 'body_scans', 'mindful_awareness', 'acceptance_practices'],
        communicationStyle: {
          directness: 'low',
          warmth: 'high',
          structure: 'low',
          pace: 'slow'
        }
      },
      psychodynamic: {
        name: 'Psychodynamic Therapy',
        description: 'Insight-oriented approach exploring unconscious patterns and relationship dynamics',
        systemPrompt: `You are a psychodynamic therapeutic assistant. Your approach is:
        - Insight-oriented and exploratory
        - Focus on unconscious patterns and relationship dynamics
        - Reflective and interpretive
        - Warm but analytical
        - Help users gain insight into underlying patterns
        
        Always maintain professional boundaries and refer to crisis resources if needed.`,
        exercises: ['pattern_recognition', 'relationship_exploration', 'insight_journaling', 'dream_analysis'],
        communicationStyle: {
          directness: 'moderate',
          warmth: 'high',
          structure: 'moderate',
          pace: 'gradual'
        }
      },
      existential: {
        name: 'Existential Therapy',
        description: 'Meaning-focused approach exploring purpose, choice, and responsibility',
        systemPrompt: `You are an existential therapeutic assistant. Your approach is:
        - Meaning-focused and philosophical
        - Explore questions of purpose, choice, and responsibility
        - Authentic and direct about life's challenges
        - Help users find meaning and make authentic choices
        - Address fundamental human concerns
        
        Always maintain professional boundaries and refer to crisis resources if needed.`,
        exercises: ['meaning_exploration', 'values_clarification', 'authentic_choice_work', 'purpose_discovery'],
        communicationStyle: {
          directness: 'high',
          warmth: 'moderate',
          structure: 'moderate',
          pace: 'moderate'
        }
      }
    };
  }

  /**
   * Generate a therapeutic response based on user's beliefs and preferences
   */
  async generateTherapeuticResponse(userMessage, userId, conversationHistory = [], context = {}) {
    try {
      // Get user's therapeutic preferences
      const therapeuticPreferences = await this.getUserTherapeuticPreferences(userId, conversationHistory);
      
      // Select appropriate therapeutic modality
      const modality = this.selectTherapeuticModality(therapeuticPreferences);
      
      // Generate belief-aware response
      const response = await this.generateModalitySpecificResponse(
        userMessage, 
        modality, 
        therapeuticPreferences, 
        conversationHistory,
        context
      );
      
      // Adapt response based on communication style preferences
      const adaptedResponse = await this.adaptResponseToCommunicationStyle(
        response, 
        therapeuticPreferences.communication_style
      );
      
      return {
        response: adaptedResponse,
        therapeuticModality: modality.name,
        suggestedExercises: this.getSuggestedExercises(modality, context),
        conversationDepth: therapeuticPreferences.conversation_depth,
        beliefConfidence: therapeuticPreferences.confidence
      };
      
    } catch (error) {
      console.error('Error generating therapeutic response:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Get user's therapeutic preferences from belief modeling
   */
  async getUserTherapeuticPreferences(userId, conversationHistory) {
    try {
      // Get user profile from database (implement this)
      const userProfile = await this.getUserProfile(userId);
      
      // Analyze conversations for therapeutic preferences
      const preferences = await this.beliefModelingService.inferTherapeuticPreferences(
        conversationHistory,
        userProfile
      );
      
      return preferences;
    } catch (error) {
      console.error('Error getting therapeutic preferences:', error);
      return this.beliefModelingService.getDefaultPreferences();
    }
  }

  /**
   * Select appropriate therapeutic modality based on preferences
   */
  selectTherapeuticModality(therapeuticPreferences) {
    const primaryModality = therapeuticPreferences.therapeuticPreferences?.primary || 'humanistic';
    return this.therapeuticModalities[primaryModality] || this.therapeuticModalities.humanistic;
  }

  /**
   * Generate modality-specific therapeutic response
   */
  async generateModalitySpecificResponse(userMessage, modality, preferences, conversationHistory, context) {
    const systemPrompt = this.buildSystemPrompt(modality, preferences, context);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role || 'user',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getModalityFallbackResponse(modality, userMessage);
    }
  }

  /**
   * Build system prompt based on modality and user preferences
   */
  buildSystemPrompt(modality, preferences, context) {
    let prompt = modality.systemPrompt;
    
    // Add communication style adjustments
    const style = preferences.communication_style || modality.communicationStyle;
    
    if (style.directness === 'low') {
      prompt += '\n\nUse gentle, non-directive language. Ask questions rather than give advice.';
    } else if (style.directness === 'high') {
      prompt += '\n\nBe direct and clear in your communication. Offer specific suggestions when appropriate.';
    }
    
    if (style.warmth === 'very_high') {
      prompt += '\n\nMaintain very warm, empathetic, and supportive communication.';
    }
    
    if (style.pace === 'slow') {
      prompt += '\n\nUse a slower, more contemplative pace. Allow space for reflection.';
    }
    
    // Add context-specific adjustments
    if (context.crisis_indicators) {
      prompt += '\n\nIMPORTANT: User may be in crisis. Maintain safety, provide crisis resources, and encourage professional help.';
    }
    
    if (context.vulnerability_level === 'high') {
      prompt += '\n\nUser is showing high vulnerability. Be extra gentle and supportive.';
    }
    
    return prompt;
  }

  /**
   * Adapt response to user's communication style preferences
   */
  async adaptResponseToCommunicationStyle(response, communicationStyle) {
    if (!communicationStyle) return response;
    
    let adaptedResponse = response;
    
    // Adjust directness
    if (communicationStyle.directness === 'low') {
      adaptedResponse = this.makeLessDirect(adaptedResponse);
    } else if (communicationStyle.directness === 'high') {
      adaptedResponse = this.makeMoreDirect(adaptedResponse);
    }
    
    // Adjust warmth
    if (communicationStyle.warmth === 'very_high') {
      adaptedResponse = this.increaseWarmth(adaptedResponse);
    }
    
    return adaptedResponse;
  }

  /**
   * Make response less direct
   */
  makeLessDirect(response) {
    return response
      .replace(/You should/g, 'You might consider')
      .replace(/You need to/g, 'It could be helpful to')
      .replace(/I recommend/g, 'I wonder if')
      .replace(/Try this/g, 'Perhaps you could explore');
  }

  /**
   * Make response more direct
   */
  makeMoreDirect(response) {
    return response
      .replace(/You might consider/g, 'I recommend')
      .replace(/It could be helpful to/g, 'You should')
      .replace(/I wonder if/g, 'I suggest')
      .replace(/Perhaps you could explore/g, 'Try this');
  }

  /**
   * Increase warmth in response
   */
  increaseWarmth(response) {
    const warmPhrases = [
      'I hear you',
      'That sounds really challenging',
      'I appreciate you sharing that',
      'You\'re doing important work',
      'I\'m here with you'
    ];
    
    // Add warm phrases at appropriate points
    if (!response.includes('I hear you') && !response.includes('That sounds')) {
      const sentences = response.split('. ');
      if (sentences.length > 1) {
        sentences.splice(1, 0, warmPhrases[Math.floor(Math.random() * warmPhrases.length)]);
        return sentences.join('. ');
      }
    }
    
    return response;
  }

  /**
   * Get suggested exercises based on modality and context
   */
  getSuggestedExercises(modality, context) {
    const exercises = [...modality.exercises];
    
    // Add context-specific exercises
    if (context.emotionalState?.includes('anxious')) {
      exercises.push('breathing_exercises', 'grounding_techniques');
    }
    
    if (context.emotionalState?.includes('overwhelmed')) {
      exercises.push('mindful_breaks', 'self_compassion_pause');
    }
    
    // Return 2-3 most relevant exercises
    return exercises.slice(0, 3);
  }

  /**
   * Get fallback response when primary generation fails
   */
  getFallbackResponse(userMessage) {
    return {
      response: "I hear what you're sharing, and I want to be present with you in this moment. Sometimes finding the right words can be challenging, but I'm here to listen and support you. What would be most helpful for you right now?",
      therapeuticModality: 'Humanistic Therapy',
      suggestedExercises: ['self_compassion_practices', 'values_clarification'],
      conversationDepth: 'moderate',
      beliefConfidence: 0.5
    };
  }

  /**
   * Get modality-specific fallback response
   */
  getModalityFallbackResponse(modality, userMessage) {
    const fallbackResponses = {
      cbt: "I notice you're sharing some challenging thoughts. Would you be open to exploring what might be contributing to these patterns?",
      humanistic: "I hear you, and I want you to know that your experience matters. What feels most important to you right now?",
      mindfulness: "I sense you're going through something difficult. What would it be like to simply notice these feelings without trying to change them?",
      psychodynamic: "I wonder if there might be deeper patterns at play here. What comes to mind when you reflect on this?",
      existential: "This sounds like it touches on some fundamental questions. What meaning are you finding in this experience?"
    };
    
    return fallbackResponses[modality.name.toLowerCase().split(' ')[0]] || fallbackResponses.humanistic;
  }

  /**
   * Get user profile from database (placeholder - implement with your database)
   */
  async getUserProfile(userId) {
    // TODO: Implement database query to get user profile
    return {
      id: userId,
      therapeutic_history: [],
      preferences: {},
      goals: []
    };
  }

  /**
   * Analyze conversation for crisis indicators
   */
  analyzeCrisisIndicators(userMessage, conversationHistory) {
    const crisisKeywords = [
      'suicide', 'kill myself', 'want to die', 'end it all', 'no reason to live',
      'better off dead', 'hurt myself', 'self-harm', 'cutting', 'overdose'
    ];
    
    const message = userMessage.toLowerCase();
    const hasCrisisKeywords = crisisKeywords.some(keyword => message.includes(keyword));
    
    // Check for escalation in recent messages
    const recentMessages = conversationHistory.slice(-5);
    const escalationPattern = recentMessages.some(msg => 
      crisisKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    );
    
    return {
      crisis_indicators: hasCrisisKeywords || escalationPattern,
      severity: hasCrisisKeywords ? 'high' : escalationPattern ? 'moderate' : 'low'
    };
  }

  /**
   * Get crisis resources and safety information
   */
  getCrisisResources() {
    return {
      national_suicide_prevention: '988',
      crisis_text_line: 'Text HOME to 741741',
      emergency: '911',
      message: 'If you\'re having thoughts of suicide, please reach out to the National Suicide Prevention Lifeline at 988 or text HOME to 741741. You\'re not alone, and help is available 24/7.'
    };
  }
}

module.exports = TherapeuticConversationService; 