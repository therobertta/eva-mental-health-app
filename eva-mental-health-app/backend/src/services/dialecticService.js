const epistemicMeService = require('./epistemicMeService');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Dialectic Conversation Service
 * Manages philosophical and belief-exploration conversations
 */
class DialecticService {
  constructor() {
    this.epistemicMe = epistemicMeService;
  }

  /**
   * Start a dialectic conversation about therapeutic beliefs
   */
  async startTherapeuticDialectic(userId, focusArea) {
    const dialecticPrompts = {
      therapeutic_approach: {
        question: "Let's explore your beliefs about how therapy works. What do you think creates positive change in therapy - is it gaining insight, learning new skills, the relationship itself, or something else?",
        followUp: "That's interesting. Can you tell me more about why that resonates with you?"
      },
      vulnerability: {
        question: "How do you feel about being vulnerable and sharing deep emotions? Is it something that comes naturally, or does it feel challenging?",
        followUp: "What has shaped your comfort level with vulnerability?"
      },
      change_beliefs: {
        question: "When you think about personal change, do you see it as something that happens gradually over time, or through sudden breakthroughs and realizations?",
        followUp: "Can you think of a time when you experienced change in that way?"
      },
      self_efficacy: {
        question: "How confident do you feel in your ability to work through mental health challenges? What gives you strength, and what feels overwhelming?",
        followUp: "What would help you feel more empowered in your mental health journey?"
      },
      meaning_making: {
        question: "How do you make sense of difficult experiences? Do you look for lessons, see them as random, or find meaning in another way?",
        followUp: "How does that perspective help or hinder your healing?"
      }
    };

    const prompt = dialecticPrompts[focusArea] || dialecticPrompts.therapeutic_approach;

    // If Epistemic Me is available, create formal dialectic
    if (this.epistemicMe.isAvailable) {
      const dialectic = await this.epistemicMe.createTherapeuticDialectic(
        userId,
        prompt.question
      );
      
      return {
        dialecticId: dialectic?.id,
        question: prompt.question,
        followUpQuestion: prompt.followUp,
        focusArea,
        source: 'epistemic_me'
      };
    }

    // Fallback response
    return {
      dialecticId: null,
      question: prompt.question,
      followUpQuestion: prompt.followUp,
      focusArea,
      source: 'local'
    };
  }

  /**
   * Process user's response to dialectic question
   */
  async processDialecticResponse(userId, dialecticId, userResponse, focusArea) {
    // Update Epistemic Me if available
    if (this.epistemicMe.isAvailable && dialecticId) {
      await this.epistemicMe.updateDialectic(userId, dialecticId, userResponse);
    }

    // Analyze response for belief indicators
    const beliefAnalysis = await this.analyzeDialecticResponse(userResponse, focusArea);
    
    // Generate thoughtful follow-up
    const followUp = await this.generateDialecticFollowUp(userResponse, focusArea, beliefAnalysis);

    return {
      analysis: beliefAnalysis,
      followUp: followUp.content,
      suggestedReflection: followUp.reflection,
      beliefInsights: beliefAnalysis.insights
    };
  }

  /**
   * Analyze dialectic response for belief patterns
   */
  async analyzeDialecticResponse(response, focusArea) {
    const analysis = {
      beliefs: [],
      insights: [],
      therapeuticIndicators: {}
    };

    const responseLower = response.toLowerCase();

    // Analyze based on focus area
    switch (focusArea) {
      case 'therapeutic_approach':
        if (responseLower.includes('skill') || responseLower.includes('tool') || responseLower.includes('technique')) {
          analysis.beliefs.push('Skills-based learning preference');
          analysis.therapeuticIndicators.cbt = true;
        }
        if (responseLower.includes('relationship') || responseLower.includes('understood') || responseLower.includes('accepted')) {
          analysis.beliefs.push('Relationship-focused healing');
          analysis.therapeuticIndicators.humanistic = true;
        }
        if (responseLower.includes('insight') || responseLower.includes('understand') || responseLower.includes('pattern')) {
          analysis.beliefs.push('Insight-oriented approach');
          analysis.therapeuticIndicators.psychodynamic = true;
        }
        break;

      case 'vulnerability':
        if (responseLower.includes('difficult') || responseLower.includes('hard') || responseLower.includes('scary')) {
          analysis.beliefs.push('Vulnerability is challenging');
          analysis.insights.push('May benefit from gradual trust-building');
        }
        if (responseLower.includes('natural') || responseLower.includes('easy') || responseLower.includes('comfortable')) {
          analysis.beliefs.push('High vulnerability comfort');
          analysis.insights.push('Ready for deeper therapeutic work');
        }
        break;

      case 'change_beliefs':
        if (responseLower.includes('gradual') || responseLower.includes('slow') || responseLower.includes('time')) {
          analysis.beliefs.push('Gradual change believer');
          analysis.insights.push('May prefer consistent, incremental approaches');
        }
        if (responseLower.includes('sudden') || responseLower.includes('breakthrough') || responseLower.includes('realize')) {
          analysis.beliefs.push('Breakthrough change believer');
          analysis.insights.push('May respond well to insight-oriented work');
        }
        break;

      case 'self_efficacy':
        const confidenceWords = ['confident', 'capable', 'strong', 'able'];
        const doubtWords = ['overwhelmed', 'helpless', 'weak', 'unable'];
        
        const hasConfidence = confidenceWords.some(word => responseLower.includes(word));
        const hasDoubt = doubtWords.some(word => responseLower.includes(word));
        
        if (hasConfidence) {
          analysis.beliefs.push('High self-efficacy');
          analysis.insights.push('Strong foundation for self-directed work');
        }
        if (hasDoubt) {
          analysis.beliefs.push('Low self-efficacy');
          analysis.insights.push('May benefit from strength-building focus');
        }
        break;

      case 'meaning_making':
        if (responseLower.includes('lesson') || responseLower.includes('growth') || responseLower.includes('purpose')) {
          analysis.beliefs.push('Growth-oriented meaning maker');
          analysis.therapeuticIndicators.humanistic = true;
          analysis.therapeuticIndicators.existential = true;
        }
        if (responseLower.includes('random') || responseLower.includes('unfair') || responseLower.includes('no reason')) {
          analysis.beliefs.push('Struggles with meaning-making');
          analysis.insights.push('May benefit from meaning-focused interventions');
        }
        break;
    }

    return analysis;
  }

  /**
   * Generate thoughtful follow-up for dialectic conversation
   */
  async generateDialecticFollowUp(userResponse, focusArea, analysis) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are conducting a dialectic conversation about ${focusArea}. 
            The user shared: "${userResponse}"
            
            Based on their response, we identified these beliefs: ${JSON.stringify(analysis.beliefs)}
            
            Generate a thoughtful follow-up that:
            1. Validates their perspective
            2. Gently explores deeper
            3. Offers a reflection or insight
            4. Remains non-judgmental and curious
            
            Keep the response conversational and under 100 words.`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      const content = response.choices[0].message.content;

      // Generate a reflection prompt
      const reflectionResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Based on the user's beliefs about ${focusArea}, create a brief reflection question they can ponder. Make it thought-provoking but gentle.`
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      });

      return {
        content,
        reflection: reflectionResponse.choices[0].message.content
      };
    } catch (error) {
      console.error('OpenAI error in dialectic follow-up:', error);
      // Fallback response
      return {
        content: "Thank you for sharing that. Your perspective gives me valuable insight into what might work best for you. How do you think this belief influences your approach to personal growth?",
        reflection: "What would it mean for your healing journey if this belief shifted even slightly?"
      };
    }
  }

  /**
   * Get dialectic conversation suggestions based on user profile
   */
  async getDialecticSuggestions(userId, currentBeliefs) {
    const suggestions = [];

    // Check which areas haven't been explored
    if (!currentBeliefs.therapeuticApproach) {
      suggestions.push({
        focusArea: 'therapeutic_approach',
        title: 'Explore Your Therapeutic Preferences',
        description: 'Discover what therapeutic approaches resonate with your beliefs about change and healing.'
      });
    }

    if (!currentBeliefs.vulnerabilityComfort || currentBeliefs.vulnerabilityComfort < 5) {
      suggestions.push({
        focusArea: 'vulnerability',
        title: 'Understanding Your Comfort with Vulnerability',
        description: 'Explore your relationship with emotional openness and what makes sharing feel safe.'
      });
    }

    if (!currentBeliefs.changeBeliefs) {
      suggestions.push({
        focusArea: 'change_beliefs',
        title: 'How Do You View Personal Change?',
        description: 'Examine your beliefs about how people grow and transform.'
      });
    }

    if (!currentBeliefs.selfEfficacy) {
      suggestions.push({
        focusArea: 'self_efficacy',
        title: 'Your Confidence in Mental Health Management',
        description: 'Explore your beliefs about your ability to navigate mental health challenges.'
      });
    }

    if (!currentBeliefs.meaningMaking) {
      suggestions.push({
        focusArea: 'meaning_making',
        title: 'Making Sense of Difficult Experiences',
        description: 'Discover how you create meaning from life\'s challenges.'
      });
    }

    return suggestions;
  }
}

module.exports = new DialecticService();