#!/usr/bin/env node

const DatabaseComparisonTool = require('./database-comparison-tool');
const fs = require('fs').promises;

class JsonConfigRunner {
  constructor(jsonConfig, dbConfig1, dbConfig2) {
    this.jsonConfig = jsonConfig;
    this.dbConfig1 = dbConfig1;
    this.dbConfig2 = dbConfig2;
    this.results = [];
  }

  async runAllTests() {
    console.log('🚀 Starting JSON Configuration-Based Database Comparison\n');
    
    for (let i = 0; i < this.jsonConfig.length; i++) {
      const tableConfig = this.jsonConfig[i];
      console.log(`TEST: ${tableConfig.name}\n`);
      
      for (const queryConfig of tableConfig.queries) {
        await this.runSingleTest(tableConfig.name, queryConfig);
        console.log('');
      }
      
      if (i < this.jsonConfig.length - 1) {
        console.log('#################################################\n');
      }
    }
    
    console.log('✅ All tests completed!');
    return this.results;
  }

  async runSingleTest(tableName, queryConfig) {
    try {
      console.log(`QUERY: ${queryConfig.query}`);
      
      const comparisonConfig = {
        db1ConnectionString: this.dbConfig1,
        db1Type: 'sqlserver',
        db1Query: queryConfig.query,
        
        db2ConnectionString: this.dbConfig2,
        db2Type: 'sqlserver',
        db2Query: queryConfig.query,
        
        acceptableDelta: 0.01,
        fieldMappings: []
      };

      const tool = new DatabaseComparisonTool(comparisonConfig);
      
      await tool.establishConnections();
      
      const db1Data = await tool.executeQuery(
        tool.db1Connection,
        queryConfig.query,
        'sqlserver'
      );
      
      const db2Data = await tool.executeQuery(
        tool.db2Connection,
        queryConfig.query,
        'sqlserver'
      );
      
      console.log(`RECORD COUNT: SOURCE: ${db1Data.length}; TARGET: ${db2Data.length}`);
      
      if (queryConfig.compare_record_count && db1Data.length !== db2Data.length) {
        console.log(`⚠️  Record count mismatch detected!`);
      }
      
      if (db1Data.length === 0 || db2Data.length === 0) {
        console.log('⚠️  One or both queries returned no data. Skipping field comparison.');
        await tool.closeConnections();
        return;
      }
      
      const detectedMappings = await tool.detectFieldMappings(db1Data, db2Data);
      const finalMappings = tool.mergeFieldMappings(detectedMappings);
      
      if (finalMappings.length === 0) {
        console.log('⚠️  No field mappings detected. Skipping comparison.');
        await tool.closeConnections();
        return;
      }
      
      await tool.compareData(db1Data, db2Data, finalMappings);
      
      this.printCustomResults(tool.results, finalMappings);
      
      this.results.push({
        tableName,
        queryName: queryConfig.name,
        query: queryConfig.query,
        sourceRecords: db1Data.length,
        targetRecords: db2Data.length,
        totalFields: finalMappings.length,
        exactMatches: tool.results.exactMatches,
        deltaMatches: tool.results.deltaMatches,
        mismatches: tool.results.significantMismatches,
        detailedResults: tool.results.detailedResults
      });
      
      await tool.closeConnections();
      
    } catch (error) {
      console.error(`❌ Test failed for ${tableName}: ${error.message}`);
      this.results.push({
        tableName,
        queryName: queryConfig.name,
        query: queryConfig.query,
        error: error.message
      });
    }
  }

  printCustomResults(results, fieldMappings) {
    const totalFields = fieldMappings.length;
    const totalRecords = results.totalRecords;
    
    if (totalRecords === 0) {
      console.log(`FIELDS: TOTAL: ${totalFields}, OK: 0, FAILED: 0`);
      return;
    }
    
    let okFields = 0;
    let failedFields = 0;
    const wrongFieldsMap = new Map();
    
    results.detailedResults.forEach((record, recordIndex) => {
      Object.entries(record.fieldComparisons).forEach(([fieldName, comparison]) => {
        if (comparison.type === 'exact' || comparison.type === 'delta') {
          okFields++;
        } else {
          failedFields++;
          const key = `${fieldName}`;
          if (!wrongFieldsMap.has(key)) {
            wrongFieldsMap.set(key, {
              field: fieldName,
              db1Value: this.formatValue(comparison.db1Value),
              db2Value: this.formatValue(comparison.db2Value)
            });
          }
        }
      });
    });
    
    console.log(`FIELDS: TOTAL: ${totalFields}, OK: ${okFields}, FAILED: ${failedFields}`);
    
    if (wrongFieldsMap.size > 0) {
      const wrongFieldsArray = Array.from(wrongFieldsMap.values());
      const wrongFieldsText = wrongFieldsArray
        .slice(0, 5)
        .map(wf => `${wf.field}: ${wf.db1Value} != ${wf.db2Value}`)
        .join('; ');
      
      console.log(`WRONG FIELDS: ${wrongFieldsText}${wrongFieldsArray.length > 5 ? '; ...' : ''}`);
    }
  }

  formatValue(value) {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 47) + '...';
    }
    return String(value);
  }

  async saveResults(filename = 'json-config-results.json') {
    try {
      await fs.writeFile(filename, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Results saved to: ${filename}`);
    } catch (error) {
      console.error('Failed to save results:', error.message);
    }
  }
}

module.exports = JsonConfigRunner;

if (require.main === module) {
  async function main() {
    const jsonConfig = [
      {
        "name": "[Trade].[dbo].[REZEFRT]",
        "queries": [
          {
            "name": "[Trade].[dbo].[REZEFRT] - TEVA",
            "query": "SELECT * FROM [Trade].[dbo].[REZEFRT] WHERE NRNUM=629014",
            "compare_record_count": true
          },
          {
            "name": "[Trade].[dbo].[REZEFRT] - Another Test",
            "query": "SELECT * FROM [Trade].[dbo].[REZEFRT] WHERE NRNUM=234743",
            "compare_record_count": true
          }
        ]
      },
      {
        "name": "[Trade].[dbo].[REZEFDelay]",
        "queries": [
          {
            "name": "[Trade].[dbo].[REZEFDelay] - TEVA",
            "query": "SELECT * FROM [Trade].[dbo].[REZEFDelay] WHERE NRNUM=629014",
            "compare_record_count": true
          },
          {
            "name": "[Trade].[dbo].[REZEFDelay] - Another Test",
            "query": "SELECT * FROM [Trade].[dbo].[REZEFDelay] WHERE NRNUM=234743",
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

    const runner = new JsonConfigRunner(jsonConfig, dbConfig1, dbConfig2);
    
    try {
      const results = await runner.runAllTests();
      await runner.saveResults();
      console.log('\n🎉 JSON configuration tests completed successfully!');
    } catch (error) {
      console.error('\n💥 JSON configuration tests failed:', error.message);
      process.exit(1);
    }
  }

  main().catch(console.error);
}
