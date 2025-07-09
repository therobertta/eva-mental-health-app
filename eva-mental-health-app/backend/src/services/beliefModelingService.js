const epistemicMeService = require('./epistemicMeService');

/**
 * Belief Modeling Service
 * Integrates with Epistemic Me SDK when available, falls back to local detection
 */
class BeliefModelingService {
  constructor() {
    this.epistemicMe = epistemicMeService;
  }

  /**
   * Infer therapeutic preferences from conversations
   */
  async inferTherapeuticPreferences(conversations, userProfile = {}) {
    const userId = userProfile.id;
    
    // Try Epistemic Me SDK first
    if (this.epistemicMe.isAvailable && userId) {
      try {
        // Ensure user has a self-model
        await this.epistemicMe.ensureUserSelfModel(userId);
        
        // Track beliefs from recent conversations
        for (const conv of conversations.slice(-5)) { // Last 5 messages
          if (conv.role === 'user') {
            await this.epistemicMe.trackBeliefFromConversation(
              userId, 
              conv.content,
              'STATEMENT'
            );
          }
        }
        
        // Get therapeutic preferences from Epistemic Me
        const preferences = await this.epistemicMe.getTherapeuticPreferences(userId);
        if (preferences) {
          return {
            ...preferences,
            source: 'epistemic_me'
          };
        }
      } catch (error) {
        console.error('Epistemic Me error, falling back to local detection:', error);
      }
    }
    
    // Fallback to local detection
    return this.localInferTherapeuticPreferences(conversations, userProfile);
  }

  /**
   * Local fallback for therapeutic preference detection
   */
  localInferTherapeuticPreferences(conversations) {
    const indicators = {
      cbt: 0,
      humanistic: 0,
      mindfulness: 0,
      psychodynamic: 0,
      existential: 0,
      somatic: 0,
      solution_focused: 0,
      dialectical_behavioral: 0,
      narrative: 0,
      acceptance_commitment: 0
    };
    
    // Keywords and patterns for each therapeutic approach
    const patterns = {
      cbt: [
        'thought', 'thinking', 'belief', 'evidence', 'rational', 'logical',
        'behavior', 'pattern', 'homework', 'practice', 'skill', 'technique',
        'goal', 'objective', 'measure', 'track', 'progress', 'solution'
      ],
      humanistic: [
        'feel', 'feeling', 'emotion', 'growth', 'potential', 'authentic',
        'self', 'acceptance', 'understanding', 'compassion', 'whole',
        'experience', 'meaning', 'value', 'choice', 'freedom'
      ],
      mindfulness: [
        'present', 'moment', 'aware', 'awareness', 'notice', 'observe',
        'accept', 'acceptance', 'breath', 'body', 'sensation', 'mindful',
        'meditation', 'peace', 'calm', 'let go', 'non-judgment'
      ],
      psychodynamic: [
        'past', 'childhood', 'parent', 'relationship', 'pattern', 'unconscious',
        'dream', 'defense', 'resistance', 'transference', 'insight',
        'understand', 'explore', 'deeper', 'underlying', 'root'
      ],
      existential: [
        'meaning', 'purpose', 'death', 'freedom', 'isolation', 'authentic',
        'responsibility', 'choice', 'existence', 'being', 'nothingness',
        'anxiety', 'dread', 'courage', 'create', 'transcend'
      ],
      somatic: [
        'body', 'sensation', 'physical', 'tense', 'relax', 'breath',
        'stomach', 'chest', 'shoulders', 'jaw', 'embodied', 'grounding',
        'nervous system', 'safety', 'movement', 'posture'
      ],
      solution_focused: [
        'solution', 'future', 'what works', 'strengths', 'resources',
        'scale', 'better', 'miracle', 'exception', 'success',
        'achieve', 'improve', 'positive', 'different', 'change'
      ],
      dialectical_behavioral: [
        'balance', 'accept', 'change', 'both', 'middle path', 'skills',
        'distress', 'tolerance', 'regulate', 'effective', 'wise mind',
        'mindful', 'interpersonal', 'radical acceptance', 'opposite action'
      ],
      narrative: [
        'story', 'narrative', 'reauthor', 'externalize', 'problem',
        'identity', 'preferred', 'unique outcome', 'dominant story',
        'alternative', 'meaning', 'context', 'influence', 'agency'
      ],
      acceptance_commitment: [
        'values', 'accept', 'committed action', 'flexibility', 'workable',
        'defusion', 'present', 'willing', 'choice', 'vitality',
        'meaningful', 'stuck', 'struggle', 'contact', 'purpose'
      ]
    };
    
    // Analyze conversations
    conversations.forEach(conv => {
      if (conv.role === 'user') {
        const text = conv.content.toLowerCase();
        
        // Check for pattern matches
        Object.keys(patterns).forEach(approach => {
          patterns[approach].forEach(keyword => {
            if (text.includes(keyword)) {
              indicators[approach]++;
            }
          });
        });
      }
    });
    
    // Determine primary modality
    let primaryModality = 'humanistic'; // default
    let maxScore = 0;
    
    Object.keys(indicators).forEach(approach => {
      if (indicators[approach] > maxScore) {
        maxScore = indicators[approach];
        primaryModality = approach;
      }
    });
    
    // Infer vulnerability comfort from conversation depth
    const vulnerabilityIndicators = ['feel', 'scared', 'vulnerable', 'honest', 'truth', 'shame', 'guilt'];
    let vulnerabilityScore = 5; // default medium
    
    conversations.forEach(conv => {
      if (conv.role === 'user') {
        const text = conv.content.toLowerCase();
        vulnerabilityIndicators.forEach(indicator => {
          if (text.includes(indicator)) {
            vulnerabilityScore = Math.min(vulnerabilityScore + 0.5, 10);
          }
        });
      }
    });
    
    // Determine change beliefs
    const gradualIndicators = ['slowly', 'gradually', 'time', 'process', 'journey'];
    const breakthroughIndicators = ['breakthrough', 'sudden', 'realize', 'epiphany', 'transform'];
    let changeBeliefs = 'gradual'; // default
    
    let gradualCount = 0;
    let breakthroughCount = 0;
    
    conversations.forEach(conv => {
      if (conv.role === 'user') {
        const text = conv.content.toLowerCase();
        gradualIndicators.forEach(indicator => {
          if (text.includes(indicator)) gradualCount++;
        });
        breakthroughIndicators.forEach(indicator => {
          if (text.includes(indicator)) breakthroughCount++;
        });
      }
    });
    
    if (breakthroughCount > gradualCount) {
      changeBeliefs = 'breakthrough';
    }
    
    return {
      primaryModality,
      vulnerabilityComfort: Math.round(vulnerabilityScore),
      changeBeliefs,
      communicationStyle: this.inferCommunicationStyle(primaryModality),
      confidence: maxScore > 5 ? 0.8 : 0.6,
      source: 'local_detection'
    };
  }

  /**
   * Infer communication style based on therapeutic modality
   */
  inferCommunicationStyle(modality) {
    const styles = {
      cbt: {
        directness: 8,
        warmth: 6,
        structure: 9,
        pace: 7
      },
      humanistic: {
        directness: 4,
        warmth: 9,
        structure: 3,
        pace: 5
      },
      mindfulness: {
        directness: 5,
        warmth: 7,
        structure: 5,
        pace: 3
      },
      psychodynamic: {
        directness: 6,
        warmth: 7,
        structure: 6,
        pace: 4
      },
      existential: {
        directness: 7,
        warmth: 6,
        structure: 4,
        pace: 5
      },
      somatic: {
        directness: 5,
        warmth: 8,
        structure: 5,
        pace: 2
      },
      solution_focused: {
        directness: 7,
        warmth: 7,
        structure: 7,
        pace: 8
      },
      dialectical_behavioral: {
        directness: 6,
        warmth: 7,
        structure: 8,
        pace: 6
      },
      narrative: {
        directness: 5,
        warmth: 8,
        structure: 5,
        pace: 4
      },
      acceptance_commitment: {
        directness: 6,
        warmth: 7,
        structure: 6,
        pace: 5
      }
    };
    
    return styles[modality] || styles.humanistic;
  }

  /**
   * Assess therapeutic readiness
   */
  assessTherapeuticReadiness(preferences) {
    const readiness = {
      overallScore: 0,
      strengths: [],
      areasForGrowth: []
    };
    
    // High vulnerability comfort is a strength
    if (preferences.vulnerabilityComfort >= 7) {
      readiness.strengths.push('High openness to emotional exploration');
      readiness.overallScore += 2;
    } else if (preferences.vulnerabilityComfort <= 3) {
      readiness.areasForGrowth.push('Building comfort with vulnerability');
    }
    
    // Clear modality preference is a strength
    if (preferences.confidence >= 0.8) {
      readiness.strengths.push('Clear therapeutic preferences');
      readiness.overallScore += 2;
    }
    
    // Belief in change is important
    if (preferences.changeBeliefs) {
      readiness.strengths.push('Belief in personal growth and change');
      readiness.overallScore += 1;
    }
    
    readiness.overallScore = Math.min(readiness.overallScore, 5);
    
    return readiness;
  }

  /**
   * Track belief evolution over time
   */
  async trackBeliefEvolution(userId, previousPreferences, currentPreferences) {
    if (this.epistemicMe.isAvailable) {
      // Track with Epistemic Me
      await this.epistemicMe.trackTherapeuticOutcome(userId, null, {
        type: 'preference_evolution',
        previous: previousPreferences,
        current: currentPreferences,
        timestamp: new Date().toISOString()
      });
    }
    
    // Calculate evolution metrics
    const evolution = {
      modalityShift: previousPreferences.primaryModality !== currentPreferences.primaryModality,
      vulnerabilityChange: currentPreferences.vulnerabilityComfort - previousPreferences.vulnerabilityComfort,
      confidenceChange: currentPreferences.confidence - previousPreferences.confidence
    };
    
    return evolution;
  }
}

module.exports = new BeliefModelingService();