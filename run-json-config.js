#!/usr/bin/env node

const JsonConfigRunner = require('./json-config-runner');
const fs = require('fs').promises;
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  try {
    const configFile = process.argv[2] || 'config.json';
    console.log(`📋 Loading JSON configuration from: ${configFile}`);
    
    const jsonConfig = JSON.parse(await fs.readFile(configFile, 'utf8'));
    
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

    const runner = new JsonConfigRunner(jsonConfig, dbConfig1, dbConfig2);
    
    const results = await runner.runAllTests();
    await runner.saveResults();
    
    console.log('\n🎉 JSON configuration tests completed successfully!');
    
  } catch (error) {
    console.error('\n💥 JSON configuration tests failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;
