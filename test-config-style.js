#!/usr/bin/env node

const DatabaseComparisonTool = require('./database-comparison-tool');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.config' });

console.log('🐳 Testing Database Comparison with Config Objects (NestJS Style)\n');

async function testConfigStyle() {
  try {
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

    const config = {
      db1ConnectionString: dbConfig1, // Pass config object instead of string
      db1Type: 'sqlserver',
      db1Query: process.env.DB1_QUERY || 'SELECT TOP 10 * FROM transactions',
      
      db2ConnectionString: dbConfig2, // Pass config object instead of string
      db2Type: 'sqlserver', 
      db2Query: process.env.DB2_QUERY || 'SELECT TOP 10 * FROM orders',
      
      acceptableDelta: parseFloat(process.env.ACCEPTABLE_DELTA) || 0.01,
      fieldMappings: []
    };

    console.log('🚀 Starting Database Comparison Tool with Config Objects\n');
    
    const tool = new DatabaseComparisonTool(config);
    await tool.run();
    
    console.log('\n✅ Config object style test completed successfully!');
    console.log('\n📋 This demonstrates both approaches work:');
    console.log('   - Connection strings: npm run test:docker');
    console.log('   - Config objects: npm run test:config');
    
  } catch (error) {
    console.error('❌ Test FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testConfigStyle();
