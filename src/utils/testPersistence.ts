// Test script to verify localStorage persistence functionality
// You can run this in browser console to test

import { 
  saveStarredBusinesses, 
  loadStarredBusinesses,
  saveStarredGoogleBusinesses,
  loadStarredGoogleBusinesses,
  saveBusinessStages,
  loadBusinessStages,
  saveEmailThreads,
  loadEmailThreads,
  saveMessagesByBusiness,
  loadMessagesByBusiness,
  clearAllPersistedData
} from './persistence';

export function testPersistence() {
  console.log('🧪 Testing localStorage persistence...');

  // Test starred businesses
  console.log('\n1. Testing starred businesses:');
  const testBusinessIds = ['biz1', 'biz2', 'biz3'];
  saveStarredBusinesses(testBusinessIds);
  const loadedBusinessIds = loadStarredBusinesses();
  console.log('Saved:', testBusinessIds);
  console.log('Loaded:', loadedBusinessIds);
  console.log('✅ Match:', JSON.stringify(testBusinessIds) === JSON.stringify(loadedBusinessIds));

  // Test Google businesses
  console.log('\n2. Testing starred Google businesses:');
  const testGoogleIds = ['google1', 'google2'];
  saveStarredGoogleBusinesses(testGoogleIds);
  const loadedGoogleIds = loadStarredGoogleBusinesses();
  console.log('Saved:', testGoogleIds);
  console.log('Loaded:', loadedGoogleIds);
  console.log('✅ Match:', JSON.stringify(testGoogleIds) === JSON.stringify(loadedGoogleIds));

  // Test business stages
  console.log('\n3. Testing business stages:');
  const testStages = { 'biz1': 'New', 'biz2': 'Contacted', 'biz3': 'Qualified' };
  saveBusinessStages(testStages);
  const loadedStages = loadBusinessStages();
  console.log('Saved:', testStages);
  console.log('Loaded:', loadedStages);
  console.log('✅ Match:', JSON.stringify(testStages) === JSON.stringify(loadedStages));

  // Test email threads
  console.log('\n4. Testing email threads:');
  const testThreads = [
    {
      businessId: 'biz1',
      emails: [
        {
          id: 'email1',
          from: 'test@example.com',
          to: 'business@example.com',
          subject: 'Test Email',
          body: 'This is a test',
          timestamp: new Date(),
          direction: 'sent'
        }
      ]
    }
  ];
  saveEmailThreads(testThreads);
  const loadedThreads = loadEmailThreads();
  console.log('Saved threads:', testThreads.length);
  console.log('Loaded threads:', loadedThreads.length);
  console.log('✅ Email count match:', testThreads[0].emails.length === loadedThreads[0]?.emails.length);
  console.log('✅ Timestamp is Date:', loadedThreads[0]?.emails[0]?.timestamp instanceof Date);

  // Test messages
  console.log('\n5. Testing messages:');
  const testMessages = {
    'biz1': [
      { id: 'msg1', text: 'Hello', timestamp: Date.now(), direction: 'outgoing' }
    ]
  };
  saveMessagesByBusiness(testMessages);
  const loadedMessages = loadMessagesByBusiness();
  console.log('Saved messages:', Object.keys(testMessages).length);
  console.log('Loaded messages:', Object.keys(loadedMessages).length);
  console.log('✅ Match:', JSON.stringify(testMessages) === JSON.stringify(loadedMessages));

  console.log('\n🧹 Cleaning up test data...');
  clearAllPersistedData();
  console.log('✅ Test complete!');
}

// To test persistence, run testPersistence() in the browser console
console.log('💡 Run testPersistence() in console to test localStorage functionality'); 