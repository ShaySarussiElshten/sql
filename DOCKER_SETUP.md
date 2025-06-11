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

- **MySQL 8.0 container** with `transactions` table
- **PostgreSQL 15 container** with `orders` table  
- **Test data** designed to demonstrate:
  - Exact matches (records 1, 4, 7, 9, 10)
  - Delta matches within tolerance (records 2, 5, 6)
  - Significant mismatches (records 3, 8)

## Database Details

### MySQL (testdb1)
- Port: 3306
- User: testuser / testpass
- Table: transactions (id, name, amount, created_at)

### PostgreSQL (testdb2)  
- Port: 5432
- User: testuser / testpass
- Table: orders (transaction_id, customer_name, total_amount, timestamp)

## Expected Results

The test should show:
- ~50% exact matches
- ~30% delta matches (small differences within tolerance)
- ~20% significant mismatches

## Cleanup

```bash
docker-compose down -v
```
