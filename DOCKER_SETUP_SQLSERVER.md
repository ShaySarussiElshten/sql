# SQL Server Docker Setup for Database Comparison

This document describes how to set up and use the SQL Server-based database comparison environment.

## Overview

The setup uses two Microsoft SQL Server 2022 Express containers to demonstrate database comparison functionality with complex JOIN queries and coordinated datasets.

## Architecture

- **SQL Server DB1**: Port 1433, Database `testdb1` with transactions schema
- **SQL Server DB2**: Port 1434, Database `testdb2` with orders schema  
- **Node.js Tool**: Uses `mssql` driver for SQL Server connectivity
- **500 Row Dataset**: Coordinated data generation with strategic comparison mix

## Quick Start

```bash
# Start SQL Server containers
docker-compose up -d

# Wait for SQL Server initialization (60-90 seconds)
sleep 90

# Install dependencies
npm install

# Run comparison test
npm run test:docker

# Clean up
docker-compose down -v
```

## SQL Server Configuration

### Container Settings
- **Image**: `mcr.microsoft.com/mssql/server:2022-latest`
- **Edition**: Express (free for development)
- **Authentication**: SA account with strong password
- **Memory**: Default SQL Server Express limits

### Environment Variables
- `ACCEPT_EULA=Y`: Required to accept SQL Server license
- `SA_PASSWORD=${SA_PASSWORD}`: Strong password for SA account (must be set via environment variable)
- `MSSQL_PID=Express`: Use free Express edition

### Connection Strings
- **DB1**: `mssql://sa:${SA_PASSWORD}@localhost:1433/testdb1`
- **DB2**: `mssql://sa:${SA_PASSWORD}@localhost:1434/testdb2`

**IMPORTANT**: You must set the `SA_PASSWORD` environment variable before starting the containers:
```bash
export SA_PASSWORD="YourStrongPassword123!"
# OR copy .env.example to .env.docker and set your password there
```

## Schema Design

### SQL Server DB1 (testdb1)
```sql
transactions (id, customer_id, product_id, amount, quantity, status, created_at)
customers (id, name, email, city, country, registration_date)
products (id, name, category_id, price, stock_quantity)
categories (id, name, description)
```

### SQL Server DB2 (testdb2)
```sql
orders (order_id, user_id, item_id, total_amount, item_count, order_status, order_date)
users (user_id, full_name, email, location, region, registration_date)
items (item_id, item_name, type_id, price, stock_quantity)
product_types (type_id, type_name, description)
```

## T-SQL Query Features

### Complex JOIN Query (DB1)
```sql
SELECT TOP 500 
    t.id as transaction_id,
    c.name as customer_name,
    p.name as product_name,
    cat.name as category_name,
    t.amount as total_amount,
    t.quantity,
    t.status as order_status,
    c.city as customer_location,
    c.country as customer_region,
    t.created_at as order_date,
    (t.amount / t.quantity) as unit_price,
    CASE 
        WHEN t.amount > 500 THEN 'high_value'
        WHEN t.amount > 100 THEN 'medium_value'
        ELSE 'low_value'
    END as value_tier
FROM transactions t
INNER JOIN customers c ON t.customer_id = c.id
INNER JOIN products p ON t.product_id = p.id
INNER JOIN categories cat ON p.category_id = cat.id
WHERE t.created_at >= '2024-01-01'
ORDER BY t.id
```

## T-SQL Syntax Differences

| MySQL/PostgreSQL | T-SQL Equivalent |
|------------------|------------------|
| `LIMIT 500` | `TOP 500` |
| `AUTO_INCREMENT` | `IDENTITY(1,1)` |
| `SERIAL` | `IDENTITY(1,1)` |
| `ENUM('a','b')` | `NVARCHAR(20) CHECK (col IN ('a','b'))` |
| `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | `DATETIME2 DEFAULT GETDATE()` |
| `VARCHAR` | `NVARCHAR` (Unicode support) |

## Data Generation

The setup includes coordinated data generation with:
- **500 transactions** in SQL Server DB1
- **500 orders** in SQL Server DB2
- **Strategic mix**: ~50% exact matches, ~2% delta matches, ~48% mismatches
- **Seeded randomization** for reproducible results

## Expected Results

```
📊 DATABASE COMPARISON REPORT
==================================================
📈 SUMMARY STATISTICS:
Total Records Compared: 500
Exact Matches: ~248 (49.60%)
Delta Matches: ~7 (1.40%)
Significant Mismatches: ~245 (49.00%)
Overall Accuracy: ~51.00%
```

## Troubleshooting

### SQL Server Startup Issues
- SQL Server containers take 60-90 seconds to fully initialize
- Check container logs: `docker logs sql-comparison-sqlserver1`
- Ensure strong password meets SQL Server requirements

### Connection Issues
- Verify ports 1433 and 1434 are available
- Check firewall settings if running on remote host
- Confirm SA password in connection string

### Memory Issues
- SQL Server Express has 1410 MB memory limit
- Use `docker stats` to monitor container resource usage
- Consider upgrading to Standard edition for larger datasets

### Query Performance
- Complex JOINs on 500 rows should complete in <5 seconds
- Add indexes if testing with larger datasets
- Monitor query execution plans for optimization

## Development Notes

- Uses `mssql` Node.js driver v10.0.1
- Supports connection pooling for better performance
- Handles SQL Server-specific data types and formatting
- Compatible with SQL Server 2019+ and Azure SQL Database
