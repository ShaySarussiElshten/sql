# 🚀 Database Comparison Tool - Execution Instructions

## 📋 Prerequisites

### 1. System Requirements
- **Node.js** version 14.0.0 or higher
- **MySQL** database server (version 5.7+ or 8.0+)
- **PostgreSQL** database server (version 10+)
- **npm** package manager

### 2. Database Setup
You need access to two databases (MySQL and/or PostgreSQL) with:
- Valid connection credentials
- Database tables with data to compare
- Network access to both database servers

## 📦 Installation Steps

### Step 1: Download the Tool
```bash
# Create a new directory for the tool
mkdir database-comparison-tool
cd database-comparison-tool

# Copy all the tool files to this directory
# (database-comparison-tool.js, package.json, etc.)
```

### Step 2: Install Dependencies
```bash
# Install required Node.js packages
npm install

# This will install:
# - mysql2 (MySQL database connector)
# - pg (PostgreSQL database connector)
```

### Step 3: Verify Installation
```bash
# Check if Node.js is installed
node --version

# Check if npm packages are installed
npm list
```

## ⚙️ Configuration

### Option 1: Environment Variables (Recommended)
Create a `.env` file in your project directory:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit the `.env` file with your database credentials:
```env
# Database 1 (MySQL example)
DB1_CONNECTION_STRING=mysql://username:password@hostname:3306/database_name
DB1_TYPE=mysql

# Database 2 (PostgreSQL example)
DB2_CONNECTION_STRING=postgresql://username:password@hostname:5432/database_name
DB2_TYPE=postgresql

# Optional: Set acceptable delta for numeric comparisons
ACCEPTABLE_DELTA=0.01
```

### Option 2: Direct Configuration
Edit the `database-comparison-tool.js` file and modify the config object:

```javascript
const config = {
  db1ConnectionString: 'mysql://user:pass@host:3306/db1',
  db1Type: 'mysql',
  db2ConnectionString: 'postgresql://user:pass@host:5432/db2',
  db2Type: 'postgresql',
  
  // Your SQL queries
  db1Query: 'SELECT id, name, amount FROM table1 ORDER BY id',
  db2Query: 'SELECT order_id, customer_name, total FROM table2 ORDER BY order_id',
  
  // Field mappings between databases
  fieldMappings: [
    { db1: 'id', db2: 'order_id' },
    { db1: 'name', db2: 'customer_name' },
    { db1: 'amount', db2: 'total' }
  ],
  
  acceptableDelta: 0.01
};
```

## 🎯 Execution Methods

### Method 1: Basic Execution
```bash
# Run the tool with default configuration
node database-comparison-tool.js
```

### Method 2: Using npm Scripts
```bash
# Run using npm start
npm start

# Run the test example
npm run test
```

### Method 3: Command Line Tool
```bash
# If installed globally, you can use:
db-compare
```

## 📝 Query Configuration

### Writing Effective Queries

**Database 1 Query Example (MySQL):**
```sql
SELECT 
  transaction_id as id,
  CONCAT(first_name, ' ', last_name) as customer_name,
  amount,
  created_at as transaction_date,
  status,
  payment_method
FROM transactions t
JOIN users u ON t.user_id = u.id
WHERE t.created_at >= '2024-01-01'
  AND t.status IN ('completed', 'pending')
ORDER BY transaction_id
LIMIT 1000
```

**Database 2 Query Example (PostgreSQL):**
```sql
SELECT 
  order_reference as reference_id,
  customer_full_name,
  total_amount,
  order_timestamp,
  order_status,
  payment_type
FROM orders
WHERE order_timestamp >= '2024-01-01T00:00:00'
  AND order_status IN ('fulfilled', 'processing')
ORDER BY order_reference
LIMIT 1000
```

### Field Mapping Configuration
```javascript
fieldMappings: [
  { db1: 'id', db2: 'reference_id' },
  { db1: 'customer_name', db2: 'customer_full_name' },
  { db1: 'amount', db2: 'total_amount' },
  { db1: 'transaction_date', db2: 'order_timestamp' },
  { db1: 'status', db2: 'order_status' },
  { db1: 'payment_method', db2: 'payment_type' }
]
```

## 🔧 Advanced Configuration

### Delta Tolerance Settings
```javascript
// For financial data (strict)
acceptableDelta: 0.001

// For general numeric data (moderate)
acceptableDelta: 0.01

// For approximate comparisons (loose)
acceptableDelta: 0.10
```

### Connection String Formats

**MySQL:**
```
mysql://username:password@hostname:port/database_name
mysql://user:pass@localhost:3306/ecommerce
mysql://admin:secret123@db.company.com:3306/production
```

**PostgreSQL:**
```
postgresql://username:password@hostname:port/database_name
postgresql://user:pass@localhost:5432/warehouse
postgresql://admin:secret123@pg.company.com:5432/analytics
```

## 🚀 Execution Examples

### Example 1: Quick Test
```bash
# Test with sample data (if available)
node test-example.js
```

### Example 2: Real Database Comparison
```bash
# Set environment variables
export DB1_CONNECTION_STRING="mysql://user:pass@host:3306/db1"
export DB2_CONNECTION_STRING="postgresql://user:pass@host:5432/db2"

# Run the comparison
node database-comparison-tool.js
```

### Example 3: Custom Configuration
```bash
# Create a custom config file
cp database-comparison-tool.js my-comparison.js

# Edit my-comparison.js with your specific queries and mappings
# Then run it
node my-comparison.js
```

## 📊 Understanding Output

### Console Output
The tool will display:
- ✅ Connection status for both databases
- 📊 Query execution results (record counts)
- 🔍 Field mapping detection
- 📈 Comparison summary statistics
- 🔍 Detailed analysis of matches and mismatches

### Generated Files
- `database-comparison-report.json` - Detailed JSON report
- Console logs with formatted results

### Sample Output
```
📊 DATABASE COMPARISON REPORT
==================================================

📈 SUMMARY STATISTICS:
Total Records Compared: 1000
Exact Matches: 750 (75.00%)
Delta Matches: 200 (20.00%)
Significant Mismatches: 50 (5.00%)
Overall Accuracy: 95.00%
```

## 🛠️ Troubleshooting

### Common Issues

**Connection Errors:**
```bash
# Check database connectivity
mysql -h hostname -u username -p database_name
psql -h hostname -U username -d database_name
```

**Permission Issues:**
- Ensure database user has SELECT permissions
- Check firewall settings for database ports
- Verify network connectivity

**Query Errors:**
- Test queries individually in database clients
- Check table and column names
- Verify data types match expectations

**Memory Issues (Large Datasets):**
- Add LIMIT clauses to queries for testing
- Process data in batches
- Increase Node.js memory limit: `node --max-old-space-size=4096`

### Debug Mode
Add debug logging to your queries:
```javascript
// Add console.log statements for debugging
console.log('DB1 Data:', db1Data.slice(0, 3)); // Show first 3 records
console.log('DB2 Data:', db2Data.slice(0, 3));
```

## 📞 Support

### Getting Help
1. Check the console output for specific error messages
2. Verify database connections work independently
3. Test with smaller datasets first
4. Review field mappings for accuracy

### Performance Tips
- Use indexed columns in ORDER BY clauses
- Limit result sets during testing
- Ensure both queries return similar record counts
- Use appropriate delta tolerance for your data precision

---

## 🎯 Quick Start Checklist

- [ ] Node.js installed (v14+)
- [ ] Database servers accessible
- [ ] npm install completed
- [ ] Connection strings configured
- [ ] Queries written and tested
- [ ] Field mappings defined
- [ ] Delta tolerance set appropriately
- [ ] Ready to run: `node database-comparison-tool.js`

**🚀 You're ready to compare your databases!**
