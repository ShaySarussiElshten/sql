# Database Comparison Tool

A comprehensive Node.js tool for comparing data between two SQL Server databases with automatic field mapping detection and detailed reporting.

## Features

- **Flexible Configuration**: Support for both environment variables and JSON-based configuration
- **Multiple Database Types**: Currently supports SQL Server with extensible architecture
- **Automatic Field Mapping**: Intelligent detection of field relationships between databases
- **Detailed Reporting**: Comprehensive comparison reports with statistics and analysis
- **NestJS Integration**: Native support for NestJS-style database configurations
- **Docker Support**: Ready-to-use Docker environment for testing

## Installation

```bash
npm install
```

## Configuration Methods

### 1. Environment Variables (.env)

Create a `.env` file with your database configurations:

```bash
# Database 1 Configuration
DB1_HOST=localhost
DB1_PORT=1433
DB1_USER=sa
DB1_PASSWORD=YourPassword
DB1_DATABASE=database1

# Database 2 Configuration
DB2_HOST=localhost
DB2_PORT=1434
DB2_USER=sa
DB2_PASSWORD=YourPassword
DB2_DATABASE=database2

# Queries (for single comparison)
DB1_QUERY=SELECT * FROM table1
DB2_QUERY=SELECT * FROM table2

# Configuration
ACCEPTABLE_DELTA=0.01
```

### 2. JSON Configuration (Multiple Tables/Queries)

Create a JSON configuration file (e.g., `config.json`):

```json
[
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
      }
    ]
  }
]
```

## Usage

### Single Comparison (Environment Variables)

```bash
# Test with config objects (NestJS style)
npm test

# Test with Docker environment
npm run test:json
```

### Multiple Comparisons (JSON Configuration)

```bash
# Run with default config.json
npm run json:config

# Run with custom configuration file
npm run json:config config-example.json

# Run JSON configuration runner directly
npm run json:run
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

## Output Format

### Standard Output
```
📊 DATABASE COMPARISON REPORT
==================================================

📈 SUMMARY STATISTICS:
Total Records Compared: 500
Exact Matches: 253 (50.60%)
Delta Matches: 2 (0.40%)
Significant Mismatches: 245 (49.00%)
Overall Accuracy: 51.00%
```

### JSON Configuration Output
```
TEST: [Trade].[dbo].[REZEFRT]

QUERY: SELECT * FROM [Trade].[dbo].[REZEFRT] WHERE NRNUM=629014
RECORD COUNT: SOURCE: 1; TARGET: 1
FIELDS: TOTAL: 20, OK: 19, FAILED: 1
WRONG FIELDS: TRADESHR: 23,876 != 22,865;

QUERY: SELECT * FROM [Trade].[dbo].[REZEFRT] WHERE NRNUM=234743
RECORD COUNT: SOURCE: 1; TARGET: 1
FIELDS: TOTAL: 15, OK: 10, FAILED: 2
WRONG FIELDS: TRADESHR: 5,876 != 4,865; TRADESHRCHG: 0.52 != 0.94

#################################################

TEST: [Trade].[dbo].[REZEFDelay]

QUERY: SELECT * FROM [Trade].[dbo].[REZEFDelay] WHERE NRNUM=629014
RECORD COUNT: SOURCE: 1; TARGET: 1
FIELDS: TOTAL: 20, OK: 19, FAILED: 1
WRONG FIELDS: TRADESHR: 23,876 != 22,865;
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

## Docker Environment

Start the test environment:

```bash
# Setup and start containers
./setup-sqlserver.sh

# Or manually
docker-compose up -d
sleep 90  # Wait for initialization
npm test
```

## API Usage

### Basic Usage

```javascript
const DatabaseComparisonTool = require('./database-comparison-tool');

const config = {
  db1ConnectionString: 'mssql://user:pass@host:port/db1',
  db1Type: 'sqlserver',
  db1Query: 'SELECT * FROM table1',
  
  db2ConnectionString: 'mssql://user:pass@host:port/db2',
  db2Type: 'sqlserver',
  db2Query: 'SELECT * FROM table2',
  
  acceptableDelta: 0.01,
  fieldMappings: []
};

const tool = new DatabaseComparisonTool(config);
const report = await tool.run();
```

### NestJS Style Configuration

```javascript
const dbConfig1 = {
  server: 'localhost',
  port: 1433,
  user: 'sa',
  password: 'password',
  database: 'database1',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

const config = {
  db1ConnectionString: dbConfig1,  // Pass config object
  db1Type: 'sqlserver',
  // ... rest of configuration
};
```

### JSON Configuration Runner

```javascript
const JsonConfigRunner = require('./json-config-runner');

const jsonConfig = [/* your JSON configuration */];
const runner = new JsonConfigRunner(jsonConfig, dbConfig1, dbConfig2);
const results = await runner.runAllTests();
```

## Field Mapping

The tool automatically detects field mappings between databases. You can also specify custom mappings:

```javascript
const config = {
  // ... other configuration
  fieldMappings: [
    { db1: 'id', db2: 'transaction_id' },
    { db1: 'name', db2: 'customer_name' },
    { db1: 'amount', db2: 'total_amount' }
  ]
};
```

## Comparison Types

- **Exact Match**: Values are identical
- **Delta Match**: Numeric values within acceptable delta range
- **Significant Mismatch**: Values differ beyond acceptable threshold

## Error Handling

The tool provides comprehensive error handling and reporting:
- Connection failures
- Query execution errors
- Data type mismatches
- Field mapping issues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License
