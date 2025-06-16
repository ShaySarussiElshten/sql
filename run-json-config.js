#!/usr/bin/env node

const JsonConfigRunner = require('./json-config-runner');
const fs = require('fs').promises;
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

async function main() {
  try {
    const configFile = process.argv[2] || 'config.json';
    
    console.log(`🔧 Loading JSON configuration from: ${configFile}`);
    
    let jsonConfig;
    try {
      const configContent = await fs.readFile(configFile, 'utf8');
      jsonConfig = JSON.parse(configContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error(`❌ Configuration file not found: ${configFile}`);
        console.log('\n💡 Usage: npm run json:config [config-file.json]');
        console.log('   Example: npm run json:config config-example.json');
        process.exit(1);
      } else {
        throw error;
      }
    }

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

    console.log(`🚀 Starting JSON Configuration Runner with ${jsonConfig.length} table(s)\n`);
    
    const runner = new JsonConfigRunner(jsonConfig, dbConfig1, dbConfig2);
    const results = await runner.runAllTests();
    await runner.saveResults();
    
    console.log('\n🎉 JSON configuration tests completed successfully!');
    
  } catch (error) {
    console.error('❌ JSON configuration runner FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;
