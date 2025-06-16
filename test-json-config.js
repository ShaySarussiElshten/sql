#!/usr/bin/env node

const JsonConfigRunner = require('./json-config-runner');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

console.log('🐳 Testing JSON Configuration-Based Database Comparison\n');

async function testJsonConfig() {
  try {
    const jsonConfig = [
      {
        "name": "[Trade].[dbo].[transactions]",
        "queries": [
          {
            "name": "[Trade].[dbo].[transactions] - Sample Test 1",
            "query": "SELECT TOP 5 id, customer_id, amount, status, created_at FROM transactions WHERE id <= 10",
            "compare_record_count": true
          },
          {
            "name": "[Trade].[dbo].[transactions] - Sample Test 2", 
            "query": "SELECT TOP 3 id, customer_id, amount, status FROM transactions WHERE amount > 100",
            "compare_record_count": true
          }
        ]
      },
      {
        "name": "[Trade].[dbo].[orders]",
        "queries": [
          {
            "name": "[Trade].[dbo].[orders] - Sample Test 1",
            "query": "SELECT TOP 5 order_id, user_id, total_amount, order_status, order_date FROM orders WHERE order_id <= 10",
            "compare_record_count": true
          },
          {
            "name": "[Trade].[dbo].[orders] - Sample Test 2",
            "query": "SELECT TOP 3 order_id, user_id, total_amount, order_status FROM orders WHERE total_amount > 100",
            "compare_record_count": true
          }
        ]
      }
    ];

    const dbConfig1 = {
      server: process.env.DB1_HOST || 'localhost',
      port: parseInt(process.env.DB1_PORT) || 1433,
      user: process.env.DB1_USER || 'sa',
      password: process.env.DB1_PASSWORD || '',
      database: process.env.DB1_DATABASE || '',
      options: {
        encrypt: false,
        trustServerCertificate: true,
      }
    };

    const dbConfig2 = {
      server: process.env.DB2_HOST || 'localhost',
      port: parseInt(process.env.DB2_PORT) || 1434,
      user: process.env.DB2_USER || 'sa',
      password: process.env.DB2_PASSWORD || '',
      database: process.env.DB2_DATABASE || '',
      options: {
        encrypt: false,
        trustServerCertificate: true,
      }
    };

    console.log('🚀 Starting JSON Configuration Runner\n');
    
    const runner = new JsonConfigRunner(jsonConfig, dbConfig1, dbConfig2);
    const results = await runner.runAllTests();
    await runner.saveResults();
    
    console.log('\n✅ JSON configuration test completed successfully!');
    console.log('\n📋 This demonstrates the new JSON-based approach:');
    console.log('   - Multiple tables with multiple queries each');
    console.log('   - Custom output format: TEST, QUERY, RECORD COUNT, FIELDS');
    console.log('   - Detailed field-by-field comparison results');
    console.log('   - Support for NestJS-style database configurations');
    
  } catch (error) {
    console.error('❌ Test FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testJsonConfig();
