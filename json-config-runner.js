#!/usr/bin/env node

const DatabaseComparisonTool = require('./database-comparison-tool');

class JsonConfigRunner {
  constructor(jsonConfig, dbConfig1, dbConfig2, options = {}) {
    this.jsonConfig = jsonConfig;
    this.dbConfig1 = dbConfig1;
    this.dbConfig2 = dbConfig2;
    this.results = [];
    this.textOutput = [];
    this.saveTextFile = options.saveTextFile !== false;
    this.textFileName = options.textFileName || 'comparison-results.txt';
  }

  async runAllTests() {
    console.log('🚀 Starting JSON Configuration-Based Database Comparison\n');
    this.textOutput.push('DATABASE COMPARISON RESULTS\n');
    this.textOutput.push('=' .repeat(50) + '\n\n');
    
    for (const table of this.jsonConfig) {
      console.log(`TEST: ${table.name}\n`);
      this.textOutput.push(`TEST: ${table.name}\n\n`);
      
      for (const queryConfig of table.queries) {
        try {
          const result = await this.runSingleQuery(table.name, queryConfig);
          this.results.push(result);
        } catch (error) {
          console.log(`❌ Test failed for ${table.name}: ${error.message}\n`);
          this.textOutput.push(`❌ Test failed for ${table.name}: ${error.message}\n\n`);
          this.results.push({
            tableName: table.name,
            queryName: queryConfig.name,
            query: queryConfig.query,
            success: false,
            error: error.message
          });
        }
      }
      
      console.log('#################################################\n');
      this.textOutput.push('#################################################\n\n');
    }
    
    return this.results;
  }

  async runSingleQuery(tableName, queryConfig) {
    console.log(`QUERY: ${queryConfig.query}`);
    this.textOutput.push(`QUERY: ${queryConfig.query}\n`);
    
    const tool = new DatabaseComparisonTool({
      db1ConnectionString: this.dbConfig1,
      db1Type: 'sqlserver',
      db2ConnectionString: this.dbConfig2, 
      db2Type: 'sqlserver',
      db1Query: queryConfig.query,
      db2Query: queryConfig.query,
      fieldMappings: [],
      acceptableDelta: parseFloat(process.env.ACCEPTABLE_DELTA) || 0.01
    });

    await tool.establishConnections();
    
    const db1Data = await tool.executeQuery(tool.db1Connection, queryConfig.query, 'sqlserver');
    const db2Data = await tool.executeQuery(tool.db2Connection, queryConfig.query, 'sqlserver');
    
    console.log(`RECORD COUNT: SOURCE: ${db1Data.length}; TARGET: ${db2Data.length}`);
    this.textOutput.push(`RECORD COUNT: SOURCE: ${db1Data.length}; TARGET: ${db2Data.length}\n`);
    
    if (db1Data.length === 0 || db2Data.length === 0) {
      console.log('FIELDS: TOTAL: 0, OK: 0, FAILED: 0');
      console.log('WRONG FIELDS: No data to compare\n');
      this.textOutput.push('FIELDS: TOTAL: 0, OK: 0, FAILED: 0\n');
      this.textOutput.push('WRONG FIELDS: No data to compare\n\n');
      await tool.closeConnections();
      return {
        tableName,
        queryName: queryConfig.name,
        query: queryConfig.query,
        success: true,
        sourceCount: db1Data.length,
        targetCount: db2Data.length,
        fieldStats: { total: 0, ok: 0, failed: 0 },
        wrongFields: []
      };
    }

    const fieldMappings = await tool.detectFieldMappings(db1Data, db2Data);
    const mergedMappings = tool.mergeFieldMappings(fieldMappings, []);
    
    await tool.compareData(db1Data, db2Data, mergedMappings);
    
    this.printCustomResults(tool.results.detailedResults, mergedMappings);
    
    await tool.closeConnections();
    
    return {
      tableName,
      queryName: queryConfig.name,
      query: queryConfig.query,
      success: true,
      sourceCount: db1Data.length,
      targetCount: db2Data.length,
      detailedResults: tool.results.detailedResults
    };
  }

  printCustomResults(results, fieldMappings) {
    let totalFields = 0;
    let okFields = 0;
    let failedFields = 0;
    const wrongFields = [];

    for (const record of results) {
      for (const [field, comparison] of Object.entries(record.fieldComparisons)) {
        totalFields++;
        if (comparison.type === 'exact' || comparison.type === 'delta') {
          okFields++;
        } else {
          failedFields++;
          wrongFields.push(`${field}: ${comparison.db1Value} != ${comparison.db2Value}`);
        }
      }
    }

    const fieldsLine = `FIELDS: TOTAL: ${fieldMappings.length}, OK: ${okFields}, FAILED: ${failedFields}`;
    console.log(fieldsLine);
    this.textOutput.push(fieldsLine + '\n');
    
    if (wrongFields.length > 0) {
      const wrongFieldsLine = `WRONG FIELDS: ${wrongFields.join(';\n')}`;
      console.log(wrongFieldsLine);
      this.textOutput.push(wrongFieldsLine + '\n');
    } else {
      console.log('WRONG FIELDS: None');
      this.textOutput.push('WRONG FIELDS: None\n');
    }
    
    console.log('');
    this.textOutput.push('\n');
  }

  async saveResults(filename = 'json-config-results.json') {
    const fs = require('fs').promises;
    await fs.writeFile(filename, JSON.stringify(this.results, null, 2));
    console.log(`💾 Results saved to: ${filename}`);
  }

  async saveTextResults(filename = null) {
    if (!this.saveTextFile) return;
    
    const fs = require('fs').promises;
    const textFileName = filename || this.textFileName;
    const textContent = this.textOutput.join('');
    
    await fs.writeFile(textFileName, textContent);
    console.log(`📄 Text results saved to: ${textFileName}`);
  }
}

module.exports = JsonConfigRunner;
