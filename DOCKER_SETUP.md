# Docker Testing Setup - SQL Server

This directory contains a Docker-based testing environment for the SQL comparison tool using Microsoft SQL Server.

## Quick Start

1. **Create environment file:**
```bash
cp .env.example .env.docker
# Edit .env.docker with your SA password
```

2. **Start the SQL Server containers:**
```bash
docker-compose --env-file .env.docker up -d
```

3. **Wait for SQL Server to initialize (90 seconds):**
```bash
sleep 90
```

4. **Create databases (one-time setup):**
```bash
docker exec sql-comparison-sqlserver1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "SqlServer2024!" -C -Q "CREATE DATABASE testdb1"
docker exec sql-comparison-sqlserver2 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "SqlServer2024!" -C -Q "CREATE DATABASE testdb2"
```

5. **Run initialization scripts:**
```bash
docker exec sql-comparison-sqlserver1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "SqlServer2024!" -C -d testdb1 -i /docker-entrypoint-initdb.d/01-init.sql
docker exec sql-comparison-sqlserver2 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "SqlServer2024!" -C -d testdb2 -i /docker-entrypoint-initdb.d/01-init.sql
```

6. **Install dependencies:**
```bash
npm install
```

7. **Run the comparison test:**
```bash
npm run test:docker
```

## What's Included

- **SQL Server 2022 container 1** with complex schema:
  - `transactions` table (main transaction data)
  - `customers` table (customer information)
  - `products` table (product catalog)
  - `categories` table (product categories)
- **SQL Server 2022 container 2** with equivalent complex schema:
  - `orders` table (main order data)
  - `users` table (user information)  
  - `items` table (item catalog)
  - `product_types` table (item categories)
- **Complex JOIN queries** with:
  - Multiple table JOINs (3-4 tables each)
  - Calculated fields (unit_price, value_tier)
  - CASE statements for categorization
  - 12 field mappings for comprehensive comparison

## Database Details

### SQL Server 1 (testdb1)
- Port: 1433
- User: sa / SqlServer2024!
- Complex query with JOINs across transactions, customers, products, categories
- Returns: transaction_id, customer_name, product_name, category_name, total_amount, quantity, order_status, customer_location, customer_region, order_date, unit_price, value_tier

### SQL Server 2 (testdb2)  
- Port: 1434
- User: sa / SqlServer2024!
- Complex query with JOINs across orders, users, items, product_types
- Returns: Same 12 fields as SQL Server 1 for comparison

## Expected Results

The test should show:
- ~50% exact matches
- ~30% delta matches (small differences within tolerance)
- ~20% significant mismatches

## Cleanup

```bash
docker-compose down -v
```
