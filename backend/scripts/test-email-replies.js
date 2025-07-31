#!/usr/bin/env node

/**
 * Test script for email reply system
 * This script tests the webhook endpoint and email processing
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

async function testWebhookEndpoint() {
  console.log('🧪 Testing webhook endpoint...');
  
  const testEmail = {
    from: 'test@example.com',
    to: 'jordan@galleongroup.co',
    subject: 'Re: Regarding your business listing - Test Business',
    html: '<p>Thank you for reaching out about our business listing. We would be interested in discussing this further.</p>',
    text: 'Thank you for reaching out about our business listing. We would be interested in discussing this further.',
    headers: {
      'message-id': 'test123@example.com',
      'references': 'original123@example.com'
    },
    attachments: []
  };

  try {
    const response = await fetch(`${API_BASE_URL}/email/inbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEmail)
    });

    if (response.ok) {
      console.log('✅ Webhook endpoint test passed');
      return true;
    } else {
      const error = await response.text();
      console.error('❌ Webhook endpoint test failed:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Webhook endpoint test failed:', error.message);
    return false;
  }
}

async function testEmailRetrieval() {
  console.log('🧪 Testing email retrieval...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/email/inbound`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Email retrieval test passed - Found ${data.count} emails`);
      return data.data;
    } else {
      const error = await response.text();
      console.error('❌ Email retrieval test failed:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Email retrieval test failed:', error.message);
    return null;
  }
}

async function testBusinessMatching(emails) {
  console.log('🧪 Testing business matching...');
  
  if (!emails || emails.length === 0) {
    console.log('⚠️  No emails to test business matching');
    return;
  }

  emails.forEach((email, index) => {
    console.log(`📧 Email ${index + 1}:`);
    console.log(`   From: ${email.from}`);
    console.log(`   Subject: ${email.subject}`);
    console.log(`   Business ID: ${email.businessId || 'Not matched'}`);
    console.log(`   Timestamp: ${email.timestamp}`);
    console.log('');
  });
}

async function testHealthCheck() {
  console.log('🧪 Testing health check...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health check passed:', data.message);
      return true;
    } else {
      console.error('❌ Health check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting email reply system tests...\n');
  
  // Test 1: Health check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('❌ Health check failed, stopping tests');
    return;
  }
  
  console.log('');
  
  // Test 2: Webhook endpoint
  const webhookOk = await testWebhookEndpoint();
  if (!webhookOk) {
    console.log('❌ Webhook test failed, stopping tests');
    return;
  }
  
  console.log('');
  
  // Test 3: Email retrieval
  const emails = await testEmailRetrieval();
  if (!emails) {
    console.log('❌ Email retrieval test failed');
    return;
  }
  
  console.log('');
  
  // Test 4: Business matching
  await testBusinessMatching(emails);
  
  console.log('');
  console.log('🎉 All tests completed!');
  console.log('');
  console.log('📋 Summary:');
  console.log('✅ Health check: PASSED');
  console.log('✅ Webhook endpoint: PASSED');
  console.log('✅ Email retrieval: PASSED');
  console.log('✅ Business matching: REVIEWED');
  console.log('');
  console.log('💡 Next steps:');
  console.log('1. Configure ImprovMX with your webhook URL');
  console.log('2. Test with real email replies');
  console.log('3. Check frontend email sync functionality');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testWebhookEndpoint,
  testEmailRetrieval,
  testBusinessMatching,
  testHealthCheck,
  runAllTests
}; 