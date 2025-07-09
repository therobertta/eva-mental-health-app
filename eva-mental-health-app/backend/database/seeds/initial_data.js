const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');

async function seedDatabase() {
  try {
    console.log('Seeding database with initial data...');
    
    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    const userId = uuidv4();
    
    await db.query(
      `INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)`,
      [userId, 'test@eva-app.com', hashedPassword, 'Test User']
    );
    console.log('✓ Created test user');
    
    // Create therapeutic profile
    const profileId = uuidv4();
    await db.query(
      `INSERT INTO therapeutic_profiles (id, user_id, therapeutic_preferences, vulnerability_comfort_level, primary_framework)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        profileId,
        userId,
        JSON.stringify({
          cbt: 0.7,
          humanistic: 0.9,
          mindfulness: 0.8,
          psychodynamic: 0.4
        }),
        7,
        'humanistic'
      ]
    );
    console.log('✓ Created therapeutic profile');
    
    // Create sample life wheel assessment
    await db.query(
      `INSERT INTO life_wheel_assessments 
       (user_id, career_score, relationships_score, health_score, personal_growth_score, 
        finances_score, recreation_score, environment_score, contribution_score, priority_areas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId, 6, 8, 7, 9, 5, 4, 7, 6,
        JSON.stringify(['recreation', 'finances', 'career'])
      ]
    );
    console.log('✓ Created life wheel assessment');
    
    // Create sample goals
    const goalCategories = [
      { text: 'Practice self-compassion daily', category: 'personal_growth' },
      { text: 'Improve work-life balance', category: 'career' },
      { text: 'Develop mindfulness practice', category: 'mental_health' }
    ];
    
    for (const goal of goalCategories) {
      await db.query(
        `INSERT INTO goals (user_id, goal_text, goal_category) VALUES ($1, $2, $3)`,
        [userId, goal.text, goal.category]
      );
    }
    console.log('✓ Created sample goals');
    
    console.log('\nDatabase seeded successfully!');
    console.log('Test user credentials:');
    console.log('Email: test@eva-app.com');
    console.log('Password: testpassword');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();