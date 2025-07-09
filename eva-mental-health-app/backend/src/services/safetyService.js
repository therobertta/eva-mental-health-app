const db = require('../../config/database');

// Crisis keywords and patterns
const CRISIS_KEYWORDS = {
  high_risk: [
    'suicide', 'kill myself', 'end my life', 'not worth living',
    'better off dead', 'want to die', 'no reason to live'
  ],
  moderate_risk: [
    'hopeless', 'worthless', 'cant go on', 'give up',
    'no point', 'empty', 'numb', 'cant take it'
  ],
  self_harm: [
    'hurt myself', 'cutting', 'self harm', 'punish myself'
  ]
};

// Crisis resources
const CRISIS_RESOURCES = [
  {
    name: 'Crisis Text Line',
    contact: 'Text HOME to 741741',
    description: '24/7 crisis support via text',
    type: 'text'
  },
  {
    name: 'National Suicide Prevention Lifeline',
    contact: '988',
    description: '24/7 phone support for crisis situations',
    type: 'phone'
  },
  {
    name: 'Emergency Services',
    contact: '911',
    description: 'For immediate danger or medical emergency',
    type: 'emergency'
  }
];

async function assessCrisisRisk(userId, message, emotionalState) {
  const messageLower = message.toLowerCase();
  let riskScore = 0;
  const riskFactors = [];
  
  // Check for high-risk keywords
  for (const keyword of CRISIS_KEYWORDS.high_risk) {
    if (messageLower.includes(keyword)) {
      riskScore += 10;
      riskFactors.push(`high_risk_keyword: ${keyword}`);
    }
  }
  
  // Check for moderate-risk keywords
  for (const keyword of CRISIS_KEYWORDS.moderate_risk) {
    if (messageLower.includes(keyword)) {
      riskScore += 5;
      riskFactors.push(`moderate_risk_keyword: ${keyword}`);
    }
  }
  
  // Check for self-harm keywords
  for (const keyword of CRISIS_KEYWORDS.self_harm) {
    if (messageLower.includes(keyword)) {
      riskScore += 7;
      riskFactors.push(`self_harm_keyword: ${keyword}`);
    }
  }
  
  // Consider emotional intensity
  if (emotionalState?.intensity >= 9) {
    riskScore += 5;
    riskFactors.push('extreme_emotional_intensity');
  }
  
  // Check for specific emotional states
  if (emotionalState?.primary_emotion === 'hopelessness' || 
      emotionalState?.primary_emotion === 'despair') {
    riskScore += 5;
    riskFactors.push(`high_risk_emotion: ${emotionalState.primary_emotion}`);
  }
  
  // Determine risk level
  let riskLevel;
  if (riskScore >= 15) {
    riskLevel = 'critical';
  } else if (riskScore >= 10) {
    riskLevel = 'high';
  } else if (riskScore >= 5) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'low';
  }
  
  // Check recent crisis history
  try {
    const recentCrisisResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM crisis_assessments 
       WHERE user_id = $1 
       AND assessment_timestamp > NOW() - INTERVAL '24 hours' 
       AND risk_level IN ('high', 'critical')`,
      [userId]
    );
    
    if (recentCrisisResult.rows[0].count > 0) {
      riskScore += 5;
      riskFactors.push('recent_crisis_history');
      if (riskLevel === 'moderate') {
        riskLevel = 'high';
      }
    }
  } catch (error) {
    console.error('Error checking crisis history:', error);
  }
  
  return {
    riskLevel,
    riskScore,
    riskFactors
  };
}

async function getCrisisResponse() {
  return {
    message: `I'm very concerned about what you're sharing. Your safety is the most important thing right now.

I want you to know that you don't have to go through this alone. There are people who want to help:

• Crisis Text Line: Text HOME to 741741 for immediate support
• National Suicide Prevention Lifeline: Call or text 988
• If you're in immediate danger, please call 911

Would you be willing to reach out to one of these resources right now? I'll stay here with you.

Is there someone you trust - a friend, family member, or therapist - who you could contact today?`,
    resources: CRISIS_RESOURCES,
    followUpRequired: true
  };
}

async function saveAndEscalateCrisis(userId, assessment) {
  try {
    // Save crisis assessment
    await db.query(
      `INSERT INTO crisis_assessments 
       (user_id, risk_level, risk_factors, intervention_triggered)
       VALUES ($1, $2, $3, $4)`,
      [userId, assessment.riskLevel, JSON.stringify(assessment.riskFactors), true]
    );
    
    // In a real application, this would trigger actual notifications
    // to crisis response teams or emergency contacts
    console.log(`CRISIS ALERT: User ${userId} assessed at ${assessment.riskLevel} risk`);
    
    // Log the intervention
    await db.query(
      `INSERT INTO audit_logs 
       (user_id, action_type, resource_type, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'crisis_detection', 'safety_assessment', 
       JSON.stringify({ riskLevel: assessment.riskLevel, automated_response: true })]
    );
    
    return true;
  } catch (error) {
    console.error('Error escalating crisis:', error);
    return false;
  }
}

// Get personalized safety plan based on user's profile
async function getPersonalizedSafetyPlan(userId) {
  try {
    // Get user's therapeutic profile
    const profileResult = await db.query(
      'SELECT * FROM therapeutic_profiles WHERE user_id = $1',
      [userId]
    );
    
    const profile = profileResult.rows[0];
    const framework = profile?.primary_framework || 'humanistic';
    
    // Framework-specific coping strategies
    const copingStrategies = {
      cognitive_behavioral: [
        'Challenge the thoughts: Write down evidence for and against your negative thoughts',
        'Behavioral activation: Do one small positive activity right now',
        'Problem-solving: Break down the overwhelming situation into smaller parts'
      ],
      humanistic: [
        'Self-compassion: Treat yourself with the same kindness you\'d show a friend',
        'Connect with your values: Remember what matters most to you',
        'Reach out: Share your feelings with someone who accepts you'
      ],
      mindfulness: [
        'Grounding: Notice 5 things you can see, 4 you can hear, 3 you can touch',
        'Breathing: Take 3 deep breaths, focusing only on the breath',
        'Observe without judgment: Notice your thoughts and feelings without fighting them'
      ],
      psychodynamic: [
        'Express emotions: Write or draw what you\'re feeling without censoring',
        'Identify patterns: Notice if this feeling connects to past experiences',
        'Seek understanding: Explore what this crisis might be telling you'
      ]
    };
    
    return {
      immediate_steps: [
        'Ensure your immediate safety',
        'Remove any means of self-harm from your environment',
        'Contact a crisis resource or trusted person'
      ],
      coping_strategies: copingStrategies[framework] || copingStrategies.humanistic,
      support_resources: CRISIS_RESOURCES,
      reminder: 'This intense feeling will pass. You have survived difficult times before.'
    };
  } catch (error) {
    console.error('Error creating safety plan:', error);
    // Return default safety plan
    return {
      immediate_steps: [
        'Ensure your immediate safety',
        'Contact a crisis resource',
        'Reach out to someone you trust'
      ],
      coping_strategies: [
        'Take deep breaths',
        'Go to a safe place',
        'Use grounding techniques'
      ],
      support_resources: CRISIS_RESOURCES,
      reminder: 'You are not alone. Help is available.'
    };
  }
}

module.exports = {
  assessCrisisRisk,
  getCrisisResponse,
  saveAndEscalateCrisis,
  getPersonalizedSafetyPlan,
  CRISIS_RESOURCES
};