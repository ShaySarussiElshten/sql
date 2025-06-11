# Docker Testing Setup

This directory contains a Docker-based testing environment for the SQL comparison tool.

## Quick Start

1. **Start the databases:**
```bash
docker-compose up -d
```

2. **Wait for databases to initialize (about 30 seconds):**
```bash
docker-compose logs -f
```

3. **Install dependencies:**
```bash
npm install
```

4. **Run the comparison test:**
```bash
node test-docker-setup.js
```

## What's Included

- **MySQL 8.0 container** with complex schema:
  - `transactions` table (main transaction data)
  - `customers` table (customer information)
  - `products` table (product catalog)
  - `categories` table (product categories)
- **PostgreSQL 15 container** with equivalent complex schema:
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

### MySQL (testdb1)
- Port: 3306
- User: testuser / testpass
- Complex query with JOINs across transactions, customers, products, categories
- Returns: transaction_id, customer_name, product_name, category_name, total_amount, quantity, order_status, customer_location, customer_region, order_date, unit_price, value_tier

### PostgreSQL (testdb2)  
- Port: 5432
- User: testuser / testpass
- Complex query with JOINs across orders, users, items, product_types
- Returns: Same 12 fields as MySQL for comparison

## Expected Results

The test should show:
- ~50% exact matches
- ~30% delta matches (small differences within tolerance)
- ~20% significant mismatches

## Cleanup

```bash
docker-compose down -v
```
