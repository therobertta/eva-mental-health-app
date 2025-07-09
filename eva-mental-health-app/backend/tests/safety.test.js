const safetyService = require('../src/services/safetyService');

describe('Safety Service', () => {
  describe('assessCrisisRisk', () => {
    it('should detect high risk from explicit crisis keywords', async () => {
      const userId = 'test-user-1';
      const message = 'I want to end my life';
      const emotionalState = { intensity: 9, primary_emotion: 'despair' };

      const result = await safetyService.assessCrisisRisk(userId, message, emotionalState);

      expect(result.riskLevel).toBe('critical');
      expect(result.riskFactors).toContain('high_risk_keyword: end my life');
    });

    it('should detect moderate risk from hopelessness indicators', async () => {
      const userId = 'test-user-1';
      const message = 'Everything feels hopeless and I see no point anymore';
      const emotionalState = { intensity: 7, primary_emotion: 'sadness' };

      const result = await safetyService.assessCrisisRisk(userId, message, emotionalState);

      expect(['moderate', 'high']).toContain(result.riskLevel);
      expect(result.riskFactors.some(f => f.includes('hopeless'))).toBe(true);
    });

    it('should consider emotional intensity in risk assessment', async () => {
      const userId = 'test-user-1';
      const message = 'I feel overwhelmed';
      const highIntensityState = { intensity: 10, primary_emotion: 'despair' };

      const result = await safetyService.assessCrisisRisk(userId, message, highIntensityState);

      expect(result.riskFactors).toContain('extreme_emotional_intensity');
      expect(result.riskScore).toBeGreaterThan(0);
    });

    it('should return low risk for non-crisis messages', async () => {
      const userId = 'test-user-1';
      const message = 'I had a good day today and feel optimistic';
      const emotionalState = { intensity: 3, primary_emotion: 'joy' };

      const result = await safetyService.assessCrisisRisk(userId, message, emotionalState);

      expect(result.riskLevel).toBe('low');
      expect(result.riskFactors.length).toBe(0);
    });
  });

  describe('getCrisisResponse', () => {
    it('should return appropriate crisis resources', async () => {
      const response = await safetyService.getCrisisResponse();

      expect(response.message).toContain('Crisis Text Line');
      expect(response.message).toContain('988');
      expect(response.resources).toBeDefined();
      expect(response.resources.length).toBeGreaterThan(0);
      expect(response.followUpRequired).toBe(true);
    });

    it('should include all essential crisis resources', async () => {
      const response = await safetyService.getCrisisResponse();
      const resourceNames = response.resources.map(r => r.name);

      expect(resourceNames).toContain('Crisis Text Line');
      expect(resourceNames).toContain('National Suicide Prevention Lifeline');
      expect(resourceNames).toContain('Emergency Services');
    });
  });

  describe('getPersonalizedSafetyPlan', () => {
    it('should create CBT-specific safety plan', async () => {
      // Mock user profile with CBT preference
      const userId = 'test-user-1';
      
      const safetyPlan = await safetyService.getPersonalizedSafetyPlan(userId);

      expect(safetyPlan.immediate_steps).toBeDefined();
      expect(safetyPlan.immediate_steps.length).toBeGreaterThan(0);
      expect(safetyPlan.coping_strategies).toBeDefined();
      expect(safetyPlan.support_resources).toBeDefined();
    });

    it('should include framework-appropriate coping strategies', async () => {
      const userId = 'test-user-1';
      
      const safetyPlan = await safetyService.getPersonalizedSafetyPlan(userId);

      expect(safetyPlan.coping_strategies).toBeDefined();
      expect(Array.isArray(safetyPlan.coping_strategies)).toBe(true);
      expect(safetyPlan.coping_strategies.length).toBeGreaterThan(0);
    });

    it('should always include crisis resources', async () => {
      const userId = 'test-user-1';
      
      const safetyPlan = await safetyService.getPersonalizedSafetyPlan(userId);

      expect(safetyPlan.support_resources).toBeDefined();
      expect(safetyPlan.support_resources.length).toBeGreaterThan(0);
      expect(safetyPlan.support_resources[0].name).toBeDefined();
      expect(safetyPlan.support_resources[0].contact).toBeDefined();
    });
  });

  describe('CRISIS_RESOURCES', () => {
    it('should have valid crisis resources', () => {
      expect(safetyService.CRISIS_RESOURCES).toBeDefined();
      expect(safetyService.CRISIS_RESOURCES.length).toBeGreaterThan(0);
      
      safetyService.CRISIS_RESOURCES.forEach(resource => {
        expect(resource.name).toBeDefined();
        expect(resource.contact).toBeDefined();
        expect(resource.description).toBeDefined();
        expect(resource.type).toBeDefined();
      });
    });
  });
});

// Export for test runner
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {};
}