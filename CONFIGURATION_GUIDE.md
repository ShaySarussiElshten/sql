# Database Comparison Tool - Configuration Guide

This guide explains the two configuration approaches supported by the database comparison tool.

## Configuration Approaches

### 1. Connection Strings (Traditional)

This is the original approach using connection string URLs.

**Environment File: `.env.docker`**
```bash
DB1_CONNECTION_STRING=mssql://sa:SqlServer2024!@localhost:1433/testdb1
DB2_CONNECTION_STRING=mssql://sa:SqlServer2024!@localhost:1434/testdb2
DB1_QUERY=SELECT TOP 500 * FROM transactions ORDER BY id
DB2_QUERY=SELECT TOP 500 * FROM orders ORDER BY order_id
ACCEPTABLE_DELTA=0.01
```

**Usage:**
```bash
npm run test:docker
```

### 2. Config Objects (NestJS Style)

This approach uses separate environment variables for each connection parameter, matching NestJS patterns.

**Environment File: `.env.config`**
```bash
# Database 1 Configuration
DB1_HOST=localhost
DB1_PORT=1433
DB1_USER=sa
DB1_PASSWORD=SqlServer2024!
DB1_DATABASE=testdb1

# Database 2 Configuration
DB2_HOST=localhost
DB2_PORT=1434
DB2_USER=sa
DB2_PASSWORD=SqlServer2024!
DB2_DATABASE=testdb2

# Queries
DB1_QUERY=SELECT TOP 500 * FROM transactions ORDER BY id
DB2_QUERY=SELECT TOP 500 * FROM orders ORDER BY order_id
ACCEPTABLE_DELTA=0.01
```

**Usage:**
```bash
npm run test:config
```

## NestJS Integration Example

If you're using this tool with a NestJS application, you can directly pass your existing config objects:

```javascript
import { DatabaseComparisonTool } from './database-comparison-tool';

// Your existing NestJS configs
const dbConfig_hc = {
    server: process.env.DB_HOST || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_Mhc || '',
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
};

const dbConfig_mabat = {
    server: process.env.DB_HOST || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_MabatCampus || '',
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
};

// Use them directly with the comparison tool
const config = {
    db1ConnectionString: dbConfig_hc,     // Pass config object
    db1Type: 'sqlserver',
    db1Query: 'SELECT TOP 1000 * FROM your_table1',
    
    db2ConnectionString: dbConfig_mabat,  // Pass config object
    db2Type: 'sqlserver',
    db2Query: 'SELECT TOP 1000 * FROM your_table2',
    
    acceptableDelta: 0.01,
    fieldMappings: []
};

const tool = new DatabaseComparisonTool(config);
await tool.run();
```

## Backward Compatibility

Both approaches work simultaneously. The tool automatically detects whether you're passing a connection string or a config object and handles it appropriately.

## Testing Setup

To test both approaches with Docker:

1. **Start SQL Server containers:**
```bash
./setup-sqlserver.sh
```

2. **Test connection strings:**
```bash
npm run test:docker
```

3. **Test config objects:**
```bash
npm run test:config
```

Both should produce identical results, demonstrating that the tool works with either configuration approach.
