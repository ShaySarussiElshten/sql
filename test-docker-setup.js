#!/usr/bin/env node

const DatabaseComparisonTool = require('./database-comparison-tool');
require('dotenv').config({ path: '.env.docker' });

async function testDockerSetup() {
  console.log('🐳 Testing Docker Database Comparison Setup\n');
  
  const config = {
    db1ConnectionString: process.env.DB1_CONNECTION_STRING,
    db1Type: 'sqlserver',
    
    db2ConnectionString: process.env.DB2_CONNECTION_STRING,
    db2Type: 'sqlserver',
    
    db1Query: process.env.DB1_QUERY,
    db2Query: process.env.DB2_QUERY,
    
    fieldMappings: [
      { db1: 'transaction_id', db2: 'transaction_id' },
      { db1: 'customer_name', db2: 'customer_name' },
      { db1: 'product_name', db2: 'product_name' },
      { db1: 'category_name', db2: 'category_name' },
      { db1: 'total_amount', db2: 'total_amount' },
      { db1: 'quantity', db2: 'quantity' },
      { db1: 'order_status', db2: 'order_status' },
      { db1: 'customer_location', db2: 'customer_location' },
      { db1: 'customer_region', db2: 'customer_region' },
      { db1: 'order_date', db2: 'order_date' },
      { db1: 'unit_price', db2: 'unit_price' },
      { db1: 'value_tier', db2: 'value_tier' }
    ],
    
    acceptableDelta: parseFloat(process.env.ACCEPTABLE_DELTA) || 0.01
  };

  const tool = new DatabaseComparisonTool(config);
  
  try {
    const report = await tool.run();
    
    console.log('\n🎯 TEST RESULTS SUMMARY:');
    console.log(`Expected: Mix of exact matches, delta matches, and mismatches`);
    console.log(`Actual: ${report.summary.exactMatches.count} exact, ${report.summary.deltaMatches.count} delta, ${report.summary.significantMismatches.count} mismatches`);
    
    if (report.summary.exactMatches.count > 0 && 
        report.summary.deltaMatches.count > 0 && 
        report.summary.significantMismatches.count > 0) {
      console.log('✅ Test PASSED: All comparison types detected correctly!');
    } else {
      console.log('⚠️  Test results may need review - check the detailed report');
    }
    
    return report;
  } catch (error) {
    console.error('❌ Test FAILED:', error.message);
    throw error;
  }
}

if (require.main === module) {
  testDockerSetup().catch(console.error);
}

module.exports = testDockerSetup;
