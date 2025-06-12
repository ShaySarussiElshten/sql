# Database Comparison Tool

A comprehensive Node.js script that connects to two databases, compares data with customizable field mappings, and generates detailed accuracy reports.

## Features

- **Multi-Database Support**: Works with Microsoft SQL Server databases
- **Flexible Field Mapping**: Define custom field mappings between databases
- **Automatic Field Detection**: Attempts to detect field mappings automatically
- **Delta Tolerance**: Configurable tolerance for numeric differences
- **Comprehensive Reporting**: Detailed analysis with match classifications
- **Error Handling**: Graceful error handling and connection management
- **Progress Tracking**: Real-time progress updates for large datasets

## Installation

1. Clone or download the script files
2. Install dependencies:

```bash
npm install
```

## Dependencies

- `mssql`: Microsoft SQL Server database connector

## Configuration

The tool supports two configuration approaches:

### 1. Connection Strings (Traditional)

Configure using connection string environment variables:

```bash
export DB1_CONNECTION_STRING="mssql://sa:password@localhost:1433/database1"
export DB2_CONNECTION_STRING="mssql://sa:password@localhost:1434/database2"
export DB1_QUERY="SELECT TOP 1000 id, name, amount FROM table1 ORDER BY id"
export DB2_QUERY="SELECT TOP 1000 transaction_id, customer_name, total_amount FROM table2 ORDER BY transaction_id"
export ACCEPTABLE_DELTA="0.01"
```

### 2. Config Objects (NestJS Style)

Configure using separate environment variables for each connection parameter:

```bash
# Database 1 Configuration
export DB1_HOST="localhost"
export DB1_PORT="1433"
export DB1_USER="sa"
export DB1_PASSWORD="password"
export DB1_DATABASE="database1"

# Database 2 Configuration
export DB2_HOST="localhost"
export DB2_PORT="1434"
export DB2_USER="sa"
export DB2_PASSWORD="password"
export DB2_DATABASE="database2"

# Queries
export DB1_QUERY="SELECT TOP 1000 id, name, amount FROM table1 ORDER BY id"
export DB2_QUERY="SELECT TOP 1000 transaction_id, customer_name, total_amount FROM table2 ORDER BY transaction_id"
export ACCEPTABLE_DELTA="0.01"
```

Use `.env.docker` for connection strings or `.env.config` for config objects.

### Code Configuration

Alternatively, modify the configuration object in the script:

```javascript
// Using connection strings (traditional approach)
const config = {
  db1ConnectionString: 'mssql://sa:password@localhost:1433/database1',
  db1Type: 'sqlserver',
  db2ConnectionString: 'mssql://sa:password@localhost:1434/database2',
  db2Type: 'sqlserver',
  
  db1Query: 'SELECT TOP 1000 id, name, amount FROM table1 ORDER BY id',
  db2Query: 'SELECT TOP 1000 transaction_id, customer_name, total_amount FROM table2 ORDER BY transaction_id',
  
  fieldMappings: [
    { db1: 'id', db2: 'transaction_id' },
    { db1: 'name', db2: 'customer_name' },
    { db1: 'amount', db2: 'total_amount' }
  ],
  
  acceptableDelta: 0.01
};

// Using config objects (NestJS style)
const configWithObjects = {
  db1ConnectionString: {
    server: 'localhost',
    port: 1433,
    user: 'sa',
    password: 'password',
    database: 'database1',
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  },
  db1Type: 'sqlserver',
  db2ConnectionString: {
    server: 'localhost',
    port: 1434,
    user: 'sa',
    password: 'password',
    database: 'database2',
    options: {
      encrypt: false,
      trustServerCertificate: true
    }
  },
  db2Type: 'sqlserver',
  
  db1Query: 'SELECT TOP 1000 id, name, amount FROM table1 ORDER BY id',
  db2Query: 'SELECT TOP 1000 transaction_id, customer_name, total_amount FROM table2 ORDER BY transaction_id',
  
  fieldMappings: [],
  acceptableDelta: 0.01
};
```

## Usage

### Basic Usage

```bash
# Test with connection strings
npm run test:docker

# Test with config objects
npm run test:config
```

### As a Module

```javascript
const DatabaseComparisonTool = require('./database-comparison-tool');

const config = {
  // ... your configuration
};

const tool = new DatabaseComparisonTool(config);
tool.run().then(report => {
  console.log('Comparison completed:', report.summary);
}).catch(error => {
  console.error('Comparison failed:', error);
});
```

## Field Mapping

### Manual Field Mapping

Define explicit mappings between database fields:

```javascript
const fieldMappings = [
  { db1: 'user_id', db2: 'customer_id' },
  { db1: 'full_name', db2: 'name' },
  { db1: 'order_total', db2: 'amount' },
  { db1: 'created_date', db2: 'timestamp' }
];
```

### Automatic Field Detection

The tool automatically attempts to detect field mappings using:

1. **Exact name matches**: Fields with identical names
2. **Fuzzy matching**: Similar names (case-insensitive, underscore/camelCase variations)

Examples of automatic detection:
- `user_id` ↔ `userId` ↔ `USER_ID`
- `created_at` ↔ `createdAt` ↔ `created_date`

### Unmapped Fields

When fields cannot be mapped automatically, the tool will:
- List all unmapped fields from both databases
- Prompt you to update the `fieldMappings` array
- Continue with available mappings

## Comparison Logic

### Match Types

1. **Exact Matches**: Values are identical
2. **Delta Matches**: Numeric differences within acceptable delta
3. **Significant Mismatches**: Differences beyond acceptable delta

### Value Comparison

- **Numeric values**: Compared with configurable delta tolerance
- **String values**: Exact comparison, with numeric parsing fallback
- **Null values**: Handled appropriately (null = null is exact match)
- **Mixed types**: Converted when possible, otherwise treated as mismatch

## Report Structure

### Summary Statistics
- Total records compared
- Count and percentage of each match type
- Overall accuracy percentage

### Detailed Analysis
- Delta statistics (min, max, average)
- Top mismatches with specific values
- Largest delta differences
- Configuration used

### Output Files
- Console report with formatted output
- JSON file with complete detailed results

## Example Output

```
📊 DATABASE COMPARISON REPORT
==================================================

📈 SUMMARY STATISTICS:
Total Records Compared: 1000
Exact Matches: 850 (85.00%)
Delta Matches: 120 (12.00%)
Significant Mismatches: 30 (3.00%)
Overall Accuracy: 97.00%

🔍 DETAILED ANALYSIS:

Delta Matches Analysis:
  • Count: 120
  • Min Delta: 0.000001
  • Max Delta: 0.009999
  • Avg Delta: 0.004523

Top Mismatches (showing first 5):
  1. Record 45, Field 'amount': 100.50 ≠ 105.75
  2. Record 123, Field 'name': John Smith ≠ J. Smith
  3. Record 234, Field 'amount': 250.00 ≠ null

Largest Delta Differences (showing top 5):
  1. Record 67, Field 'amount': 1000.00 vs 1000.009999 (Δ=0.009999)
  2. Record 89, Field 'amount': 500.25 vs 500.259 (Δ=0.009000)

⚙️  CONFIGURATION:
Acceptable Delta: 0.01
Field Mappings Used: 4
```

## Error Handling

The tool handles various error scenarios:

- **Connection failures**: Clear error messages with connection details
- **Query execution errors**: SQL syntax or permission issues
- **Data type mismatches**: Graceful handling of incompatible types
- **Missing mappings**: Warnings and suggestions for unmapped fields
- **Large datasets**: Progress indicators and memory management

## Best Practices

1. **Test with small datasets first** to verify field mappings
2. **Use appropriate LIMIT clauses** in queries for large tables
3. **Set reasonable delta values** based on your data precision requirements
4. **Review unmapped fields** and update mappings as needed
5. **Monitor memory usage** for very large datasets

## Troubleshooting

### Connection Issues
- Verify connection strings and credentials
- Check network connectivity and firewall settings
- Ensure database servers are running

### Mapping Issues
- Review field names in both databases
- Check for typos in field mapping configuration
- Use the automatic detection output to identify available fields

### Performance Issues
- Add LIMIT clauses to queries for testing
- Use indexed columns in ORDER BY clauses
- Consider comparing data in batches for very large datasets

## License

MIT License - feel free to modify and distribute as needed.
