const beliefModelingService = require('../src/services/beliefModelingService');

describe('Belief Modeling Service', () => {
  describe('inferTherapeuticPreferences', () => {
    it('should detect CBT preferences from conversation patterns', async () => {
      const conversations = [
        { role: 'user', content: 'I want to track my thoughts and challenge negative thinking patterns' },
        { role: 'assistant', content: 'That sounds like a great approach.' },
        { role: 'user', content: 'I believe my thoughts are creating my anxiety and I want practical solutions' }
      ];

      const result = await beliefModelingService.inferTherapeuticPreferences(conversations);
      
      expect(result.primaryModality).toBe('cbt');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should detect humanistic preferences from conversation patterns', async () => {
      const conversations = [
        { role: 'user', content: 'I want to explore my feelings and understand my authentic self' },
        { role: 'assistant', content: 'I hear you wanting to connect with your true self.' },
        { role: 'user', content: 'Yes, I believe in my potential for growth and self-acceptance' }
      ];

      const result = await beliefModelingService.inferTherapeuticPreferences(conversations);
      
      expect(result.primaryModality).toBe('humanistic');
    });

    it('should detect mindfulness preferences from conversation patterns', async () => {
      const conversations = [
        { role: 'user', content: 'I want to practice being present and accepting my current experience' },
        { role: 'assistant', content: 'Mindfulness can be very helpful.' },
        { role: 'user', content: 'Yes, I want to observe my thoughts without judgment and find peace' }
      ];

      const result = await beliefModelingService.inferTherapeuticPreferences(conversations);
      
      expect(result.primaryModality).toBe('mindfulness');
    });

    it('should assess vulnerability comfort level', async () => {
      const highVulnerabilityConversations = [
        { role: 'user', content: 'I feel scared to share this but I need to be honest about my shame' },
        { role: 'user', content: 'I feel vulnerable talking about this but I trust the process' }
      ];

      const result = await beliefModelingService.inferTherapeuticPreferences(highVulnerabilityConversations);
      
      expect(result.vulnerabilityComfort).toBeGreaterThan(5);
    });

    it('should detect change beliefs', async () => {
      const gradualChangeConversations = [
        { role: 'user', content: 'I know change takes time and happens gradually through the process' },
        { role: 'user', content: 'I believe in slowly building new habits over time' }
      ];

      const result = await beliefModelingService.inferTherapeuticPreferences(gradualChangeConversations);
      
      expect(result.changeBeliefs).toBe('gradual');
    });
  });

  describe('inferCommunicationStyle', () => {
    it('should return appropriate communication style for CBT', () => {
      const style = beliefModelingService.inferCommunicationStyle('cbt');
      
      expect(style.directness).toBe(8);
      expect(style.structure).toBe(9);
      expect(style.warmth).toBe(6);
    });

    it('should return appropriate communication style for humanistic', () => {
      const style = beliefModelingService.inferCommunicationStyle('humanistic');
      
      expect(style.warmth).toBe(9);
      expect(style.directness).toBe(4);
      expect(style.structure).toBe(3);
    });
  });

  describe('assessTherapeuticReadiness', () => {
    it('should identify strengths in therapeutic readiness', () => {
      const preferences = {
        vulnerabilityComfort: 8,
        confidence: 0.85,
        changeBeliefs: 'gradual'
      };

      const readiness = beliefModelingService.assessTherapeuticReadiness(preferences);
      
      expect(readiness.strengths).toContain('High openness to emotional exploration');
      expect(readiness.strengths).toContain('Clear therapeutic preferences');
      expect(readiness.overallScore).toBeGreaterThan(0);
    });

    it('should identify areas for growth', () => {
      const preferences = {
        vulnerabilityComfort: 2,
        confidence: 0.5,
        changeBeliefs: 'gradual'
      };

      const readiness = beliefModelingService.assessTherapeuticReadiness(preferences);
      
      expect(readiness.areasForGrowth).toContain('Building comfort with vulnerability');
    });
  });
});

// Export for test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {};
}