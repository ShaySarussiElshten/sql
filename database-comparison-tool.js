#!/usr/bin/env node

const sql = require('mssql');
const fs = require('fs').promises;

class DatabaseComparisonTool {
  constructor(config) {
    this.config = config;
    this.db1Connection = null;
    this.db2Connection = null;
    this.fieldMappings = config.fieldMappings || [];
    this.acceptableDelta = config.acceptableDelta || 0.001;
    
    this.fieldPrecision = new Map();
    if (config.fieldPrecision) {
      for (const [fieldName, delta] of Object.entries(config.fieldPrecision)) {
        this.fieldPrecision.set(fieldName, delta);
      }
    }
    
    this.results = {
      totalRecords: 0,
      exactMatches: 0,
      deltaMatches: 0,
      significantMismatches: 0,
      errors: [],
      detailedResults: []
    };
  }

  async connectToDatabase(connectionConfig, dbType) {
    try {
      console.log(`Connecting to ${dbType} database...`);
      
      if (dbType === 'sqlserver') {
        let config;
        
        if (typeof connectionConfig === 'string') {
          const url = new URL(connectionConfig);
          config = {
            server: url.hostname,
            port: parseInt(url.port) || 1433,
            user: url.username,
            password: url.password,
            database: url.pathname.substring(1),
            options: {
              encrypt: false,
              trustServerCertificate: true
            }
          };
        } else {
          config = connectionConfig;
        }
        
        const pool = new sql.ConnectionPool(config);
        await pool.connect();
        console.log(`✓ Successfully connected to ${dbType} database`);
        return pool;
      } else {
        throw new Error(`Unsupported database type: ${dbType}`);
      }
    } catch (error) {
      console.error(`✗ Failed to connect to ${dbType} database:`, error.message);
      throw error;
    }
  }

  async establishConnections() {
    try {
      this.db1Connection = await this.connectToDatabase(
        this.config.db1ConnectionString,
        this.config.db1Type
      );
      
      this.db2Connection = await this.connectToDatabase(
        this.config.db2ConnectionString,
        this.config.db2Type
      );
      
      console.log('✓ All database connections established successfully\n');
    } catch (error) {
      console.error('Failed to establish database connections:', error.message);
      throw error;
    }
  }

  async executeQuery(connection, query, dbType) {
    try {
      if (dbType === 'sqlserver') {
        const result = await connection.request().query(query);
        return result.recordset;
      }
    } catch (error) {
      console.error(`Query execution failed on ${dbType}:`, error.message);
      throw error;
    }
  }

  async detectFieldMappings(db1Data, db2Data) {
    console.log('🔍 Attempting to detect field mappings...');
    
    if (!db1Data.length || !db2Data.length) {
      console.log('⚠️  Cannot detect mappings: one or both datasets are empty');
      return [];
    }

    const db1Fields = Object.keys(db1Data[0]);
    const db2Fields = Object.keys(db2Data[0]);
    const detectedMappings = [];
    const unmappedFields = [];

    for (const db1Field of db1Fields) {
      if (db2Fields.includes(db1Field)) {
        detectedMappings.push({ db1: db1Field, db2: db1Field });
        console.log(`✓ Exact match detected: ${db1Field} ↔ ${db1Field}`);
      }
    }

    const mappedDb1Fields = detectedMappings.map(m => m.db1);
    const mappedDb2Fields = detectedMappings.map(m => m.db2);
    
    for (const db1Field of db1Fields) {
      if (mappedDb1Fields.includes(db1Field)) continue;
      
      const normalizedDb1 = this.normalizeFieldName(db1Field);
      
      for (const db2Field of db2Fields) {
        if (mappedDb2Fields.includes(db2Field)) continue;
        
        const normalizedDb2 = this.normalizeFieldName(db2Field);
        
        if (normalizedDb1 === normalizedDb2) {
          detectedMappings.push({ db1: db1Field, db2: db2Field });
          console.log(`✓ Fuzzy match detected: ${db1Field} ↔ ${db2Field}`);
          break;
        }
      }
    }

    const finalMappedDb1 = detectedMappings.map(m => m.db1);
    const finalMappedDb2 = detectedMappings.map(m => m.db2);
    
    for (const field of db1Fields) {
      if (!finalMappedDb1.includes(field)) {
        unmappedFields.push({ database: 'DB1', field });
      }
    }
    
    for (const field of db2Fields) {
      if (!finalMappedDb2.includes(field)) {
        unmappedFields.push({ database: 'DB2', field });
      }
    }

    if (unmappedFields.length > 0) {
      console.log('\n⚠️  Unmapped fields detected:');
      unmappedFields.forEach(({ database, field }) => {
        console.log(`   ${database}: ${field}`);
      });
      console.log('\n📝 Please update your fieldMappings array to include these fields if needed.');
    }

    return detectedMappings;
  }

  normalizeFieldName(fieldName) {
    return fieldName
      .toLowerCase()
      .replace(/[_-]/g, '')
      .replace(/([a-z])([A-Z])/g, '$1$2')
      .toLowerCase();
  }

  mergeFieldMappings(detectedMappings) {
    const userMappedFields = {
      db1: this.fieldMappings.map(m => m.db1),
      db2: this.fieldMappings.map(m => m.db2)
    };

    const additionalMappings = detectedMappings.filter(detected => 
      !userMappedFields.db1.includes(detected.db1) && 
      !userMappedFields.db2.includes(detected.db2)
    );

    const finalMappings = [...this.fieldMappings, ...additionalMappings];
    
    console.log(`\n📋 Final field mappings (${finalMappings.length} total):`);
    finalMappings.forEach((mapping, index) => {
      const source = this.fieldMappings.includes(mapping) ? 'user-defined' : 'auto-detected';
      console.log(`   ${index + 1}. ${mapping.db1} ↔ ${mapping.db2} (${source})`);
    });

    return finalMappings;
  }

  compareValues(value1, value2, fieldName) {
    if (value1 === null && value2 === null) return { type: 'exact', delta: 0 };
    if (value1 === null || value2 === null) return { type: 'mismatch', delta: null };

    const acceptableDelta = this.fieldPrecision.get(fieldName) || this.acceptableDelta;

    if (typeof value1 === 'number' && typeof value2 === 'number') {
      const delta = Math.abs(value1 - value2);
      if (delta === 0) return { type: 'exact', delta: 0 };
      if (delta <= acceptableDelta) return { type: 'delta', delta };
      return { type: 'mismatch', delta };
    }

    if (value1 instanceof Date && value2 instanceof Date) {
      const timeDiff = Math.abs(value1.getTime() - value2.getTime());
      if (timeDiff === 0) return { type: 'exact', delta: 0 };
      if (timeDiff <= 1000) return { type: 'delta', delta: timeDiff / 1000 };
      return { type: 'mismatch', delta: timeDiff / 1000 };
    }

    if (typeof value1 === 'string' && typeof value2 === 'string') {
      if (value1 === value2) return { type: 'exact', delta: 0 };
      
      if (this.isDateTimeField(fieldName)) {
        const date1 = this.parseDateTime(value1);
        const date2 = this.parseDateTime(value2);
        if (date1 && date2) {
          const timeDiff = Math.abs(date1.getTime() - date2.getTime());
          if (timeDiff === 0) return { type: 'exact', delta: 0 };
          if (timeDiff <= 1000) return { type: 'delta', delta: timeDiff / 1000 };
          return { type: 'mismatch', delta: timeDiff / 1000 };
        }
      }

      if (this.isStatusField(fieldName)) {
        if (this.areEquivalentStatuses(value1, value2)) {
          return { type: 'exact', delta: 0 };
        }
      }

      if (this.isPaymentField(fieldName)) {
        if (this.areEquivalentPaymentMethods(value1, value2)) {
          return { type: 'exact', delta: 0 };
        }
      }
      
      const num1 = parseFloat(value1);
      const num2 = parseFloat(value2);
      if (!isNaN(num1) && !isNaN(num2)) {
        const delta = Math.abs(num1 - num2);
        if (delta === 0) return { type: 'exact', delta: 0 };
        if (delta <= acceptableDelta) return { type: 'delta', delta };
        return { type: 'mismatch', delta };
      }
      
      return { type: 'mismatch', delta: null };
    }

    if (value1 === value2) return { type: 'exact', delta: 0 };
    return { type: 'mismatch', delta: null };
  }

  isDateTimeField(fieldName) {
    const dateTimeFields = ['date', 'time', 'timestamp', 'created', 'updated', 'modified'];
    return dateTimeFields.some(keyword => fieldName.toLowerCase().includes(keyword));
  }

  parseDateTime(dateString) {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  }

  isStatusField(fieldName) {
    const statusFields = ['status', 'state', 'condition'];
    return statusFields.some(keyword => fieldName.toLowerCase().includes(keyword));
  }

  areEquivalentStatuses(status1, status2) {
    const statusMappings = {
      'completed': ['fulfilled', 'complete', 'done', 'finished'],
      'pending': ['processing', 'in_progress', 'active', 'waiting'],
      'failed': ['cancelled', 'canceled', 'rejected', 'declined', 'error'],
      'success': ['successful', 'ok', 'approved'],
      'active': ['enabled', 'live', 'running'],
      'inactive': ['disabled', 'paused', 'stopped']
    };

    const normalize = (status) => status.toLowerCase().replace(/[_-]/g, '');
    const norm1 = normalize(status1);
    const norm2 = normalize(status2);

    if (norm1 === norm2) return true;

    for (const [key, equivalents] of Object.entries(statusMappings)) {
      const normalizedKey = normalize(key);
      const normalizedEquivalents = equivalents.map(normalize);
      
      if ((norm1 === normalizedKey && normalizedEquivalents.includes(norm2)) ||
          (norm2 === normalizedKey && normalizedEquivalents.includes(norm1)) ||
          (normalizedEquivalents.includes(norm1) && normalizedEquivalents.includes(norm2))) {
        return true;
      }
    }

    return false;
  }

  isPaymentField(fieldName) {
    const paymentFields = ['payment', 'method', 'type'];
    return paymentFields.some(keyword => fieldName.toLowerCase().includes(keyword));
  }

  areEquivalentPaymentMethods(method1, method2) {
    const paymentMappings = {
      'credit_card': ['creditcard', 'cc', 'card'],
      'debit_card': ['debitcard', 'debit'],
      'bank_transfer': ['wire_transfer', 'wire', 'transfer', 'ach'],
      'paypal': ['pp'],
      'cash': ['money', 'currency']
    };

    const normalize = (method) => method.toLowerCase().replace(/[_-]/g, '');
    const norm1 = normalize(method1);
    const norm2 = normalize(method2);

    if (norm1 === norm2) return true;

    for (const [key, equivalents] of Object.entries(paymentMappings)) {
      const normalizedKey = normalize(key);
      const normalizedEquivalents = equivalents.map(normalize);
      
      if ((norm1 === normalizedKey && normalizedEquivalents.includes(norm2)) ||
          (norm2 === normalizedKey && normalizedEquivalents.includes(norm1)) ||
          (normalizedEquivalents.includes(norm1) && normalizedEquivalents.includes(norm2))) {
        return true;
      }
    }

    return false;
  }

  async compareData(db1Data, db2Data, fieldMappings) {
    console.log('\n🔄 Starting data comparison...');
    
    const minLength = Math.min(db1Data.length, db2Data.length);
    this.results.totalRecords = minLength;

    if (db1Data.length !== db2Data.length) {
      console.log(`⚠️  Record count mismatch: DB1 has ${db1Data.length} records, DB2 has ${db2Data.length} records`);
      console.log(`Comparing first ${minLength} records from each database`);
    }

    for (let i = 0; i < minLength; i++) {
      const record1 = db1Data[i];
      const record2 = db2Data[i];
      const recordResult = {
        recordIndex: i,
        fieldComparisons: {},
        overallMatch: 'exact'
      };

      let hasExactMatch = true;
      let hasDeltaMatch = false;

      for (const mapping of fieldMappings) {
        const value1 = record1[mapping.db1];
        const value2 = record2[mapping.db2];
        const comparison = this.compareValues(value1, value2, mapping.db1);

        recordResult.fieldComparisons[mapping.db1] = {
          db1Value: value1,
          db2Value: value2,
          ...comparison
        };

        if (comparison.type === 'mismatch') {
          hasExactMatch = false;
          hasDeltaMatch = false;
          recordResult.overallMatch = 'mismatch';
        } else if (comparison.type === 'delta') {
          hasExactMatch = false;
          hasDeltaMatch = true;
          if (recordResult.overallMatch !== 'mismatch') {
            recordResult.overallMatch = 'delta';
          }
        }
      }

      this.results.detailedResults.push(recordResult);

      if (recordResult.overallMatch === 'exact') {
        this.results.exactMatches++;
      } else if (recordResult.overallMatch === 'delta') {
        this.results.deltaMatches++;
      } else {
        this.results.significantMismatches++;
      }

      if (minLength > 100 && (i + 1) % Math.floor(minLength / 10) === 0) {
        const progress = Math.round(((i + 1) / minLength) * 100);
        console.log(`   Progress: ${progress}% (${i + 1}/${minLength} records)`);
      }
    }

    console.log('✓ Data comparison completed\n');
  }

  generateReport() {
    const total = this.results.totalRecords;
    const exactPct = total > 0 ? (this.results.exactMatches / total * 100).toFixed(2) : 0;
    const deltaPct = total > 0 ? (this.results.deltaMatches / total * 100).toFixed(2) : 0;
    const mismatchPct = total > 0 ? (this.results.significantMismatches / total * 100).toFixed(2) : 0;
    const accuracyPct = total > 0 ? ((this.results.exactMatches + this.results.deltaMatches) / total * 100).toFixed(2) : 0;

    const report = {
      summary: {
        totalRecordsCompared: total,
        exactMatches: {
          count: this.results.exactMatches,
          percentage: exactPct
        },
        deltaMatches: {
          count: this.results.deltaMatches,
          percentage: deltaPct
        },
        significantMismatches: {
          count: this.results.significantMismatches,
          percentage: mismatchPct
        },
        overallAccuracy: accuracyPct
      },
      detailedAnalysis: this.generateDetailedAnalysis(),
      configuration: {
        acceptableDelta: this.acceptableDelta,
        fieldMappingsUsed: this.fieldMappings.length + (this.detectedMappings?.length || 0)
      }
    };

    return report;
  }

  generateDetailedAnalysis() {
    const deltaValues = [];
    const mismatchDetails = [];

    this.results.detailedResults.forEach((record, index) => {
      Object.entries(record.fieldComparisons).forEach(([field, comparison]) => {
        if (comparison.type === 'delta') {
          deltaValues.push({
            recordIndex: index,
            field,
            delta: comparison.delta,
            db1Value: comparison.db1Value,
            db2Value: comparison.db2Value
          });
        } else if (comparison.type === 'mismatch') {
          mismatchDetails.push({
            recordIndex: index,
            field,
            db1Value: comparison.db1Value,
            db2Value: comparison.db2Value
          });
        }
      });
    });

    const deltaStats = deltaValues.length > 0 ? {
      count: deltaValues.length,
      minDelta: Math.min(...deltaValues.map(d => d.delta)),
      maxDelta: Math.max(...deltaValues.map(d => d.delta)),
      avgDelta: deltaValues.reduce((sum, d) => sum + d.delta, 0) / deltaValues.length
    } : null;

    return {
      deltaAnalysis: deltaStats,
      topMismatches: mismatchDetails.slice(0, 10), // Show first 10 mismatches
      topDeltas: deltaValues.sort((a, b) => b.delta - a.delta).slice(0, 10) // Show top 10 deltas
    };
  }

  printReport(report) {
    console.log('📊 DATABASE COMPARISON REPORT');
    console.log('=' .repeat(50));
    
    console.log('\n📈 SUMMARY STATISTICS:');
    console.log(`Total Records Compared: ${report.summary.totalRecordsCompared}`);
    console.log(`Exact Matches: ${report.summary.exactMatches.count} (${report.summary.exactMatches.percentage}%)`);
    console.log(`Delta Matches: ${report.summary.deltaMatches.count} (${report.summary.deltaMatches.percentage}%)`);
    console.log(`Significant Mismatches: ${report.summary.significantMismatches.count} (${report.summary.significantMismatches.percentage}%)`);
    console.log(`Overall Accuracy: ${report.summary.overallAccuracy}%`);

    console.log('\n🔍 DETAILED ANALYSIS:');
    
    if (report.detailedAnalysis.deltaAnalysis) {
      const delta = report.detailedAnalysis.deltaAnalysis;
      console.log(`\nDelta Matches Analysis:`);
      console.log(`  • Count: ${delta.count}`);
      console.log(`  • Min Delta: ${delta.minDelta.toFixed(6)}`);
      console.log(`  • Max Delta: ${delta.maxDelta.toFixed(6)}`);
      console.log(`  • Avg Delta: ${delta.avgDelta.toFixed(6)}`);
    }

    if (report.detailedAnalysis.topMismatches.length > 0) {
      console.log(`\nTop Mismatches (showing first ${Math.min(5, report.detailedAnalysis.topMismatches.length)}):`);
      report.detailedAnalysis.topMismatches.slice(0, 5).forEach((mismatch, index) => {
        console.log(`  ${index + 1}. Record ${mismatch.recordIndex}, Field '${mismatch.field}': ${mismatch.db1Value} ≠ ${mismatch.db2Value}`);
      });
    }

    if (report.detailedAnalysis.topDeltas.length > 0) {
      console.log(`\nLargest Delta Differences (showing top ${Math.min(5, report.detailedAnalysis.topDeltas.length)}):`);
      report.detailedAnalysis.topDeltas.slice(0, 5).forEach((delta, index) => {
        console.log(`  ${index + 1}. Record ${delta.recordIndex}, Field '${delta.field}': ${delta.db1Value} vs ${delta.db2Value} (Δ=${delta.delta.toFixed(6)})`);
      });
    }

    console.log('\n⚙️  CONFIGURATION:');
    console.log(`Acceptable Delta: ${report.configuration.acceptableDelta}`);
    console.log(`Field Mappings Used: ${report.configuration.fieldMappingsUsed}`);
  }

  async saveReportToFile(report, filename = 'database-comparison-report.json') {
    try {
      await fs.writeFile(filename, JSON.stringify(report, null, 2));
      console.log(`\n💾 Detailed report saved to: ${filename}`);
    } catch (error) {
      console.error('Failed to save report:', error.message);
    }
  }

  async closeConnections() {
    try {
      if (this.db1Connection) {
        if (this.config.db1Type === 'sqlserver') {
          await this.db1Connection.close();
        }
      }
      
      if (this.db2Connection) {
        if (this.config.db2Type === 'sqlserver') {
          await this.db2Connection.close();
        }
      }
      
      console.log('✓ Database connections closed');
    } catch (error) {
      console.error('Error closing connections:', error.message);
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Database Comparison Tool\n');
      
      await this.establishConnections();
      
      console.log('📊 Executing queries...');
      const db1Data = await this.executeQuery(
        this.db1Connection,
        this.config.db1Query,
        this.config.db1Type
      );
      console.log(`✓ DB1 query returned ${db1Data.length} records`);
      
      const db2Data = await this.executeQuery(
        this.db2Connection,
        this.config.db2Query,
        this.config.db2Type
      );
      console.log(`✓ DB2 query returned ${db2Data.length} records`);
      
      const detectedMappings = await this.detectFieldMappings(db1Data, db2Data);
      this.detectedMappings = detectedMappings;
      const finalMappings = this.mergeFieldMappings(detectedMappings);
      
      if (finalMappings.length === 0) {
        throw new Error('No field mappings available. Please define fieldMappings in your configuration.');
      }
      
      await this.compareData(db1Data, db2Data, finalMappings);
      
      const report = this.generateReport();
      this.printReport(report);
      
      await this.saveReportToFile(report);
      
      return report;
      
    } catch (error) {
      console.error('❌ Comparison failed:', error.message);
      this.results.errors.push(error.message);
      throw error;
    } finally {
      await this.closeConnections();
    }
  }
}

async function main() {
  const config = {
    db1ConnectionString: process.env.DB1_CONNECTION_STRING || 'mssql://sa:StrongPassword123!@localhost:1433/testdb1',
    db1Type: 'sqlserver',
    
    db2ConnectionString: process.env.DB2_CONNECTION_STRING || 'mssql://sa:StrongPassword123!@localhost:1434/testdb2',
    db2Type: 'sqlserver',
    
    db1Query: process.env.DB1_QUERY || 'SELECT TOP 1000 id, name, amount, created_at FROM transactions ORDER BY id',
    db2Query: process.env.DB2_QUERY || 'SELECT TOP 1000 transaction_id, customer_name, total_amount, timestamp FROM orders ORDER BY transaction_id',
    
    fieldMappings: [
      { db1: 'id', db2: 'transaction_id' },
      { db1: 'name', db2: 'customer_name' },
      { db1: 'amount', db2: 'total_amount' },
      { db1: 'created_at', db2: 'timestamp' }
    ],
    
    acceptableDelta: parseFloat(process.env.ACCEPTABLE_DELTA) || 0.01
  };

  const tool = new DatabaseComparisonTool(config);
  
  try {
    const report = await tool.run();
    console.log('\n🎉 Comparison completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Comparison failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DatabaseComparisonTool;
