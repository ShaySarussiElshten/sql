#!/bin/bash

echo "🐳 SQL Server Database Comparison Setup Script"
echo "=============================================="

if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Creating .env file with NestJS-style configuration..."
    cat > .env << 'EOF'

DB1_HOST=localhost
DB1_PORT=1433
DB1_USER=sa
DB1_PASSWORD=SqlServer2024!
DB1_DATABASE=testdb1

DB2_HOST=localhost
DB2_PORT=1434
DB2_USER=sa
DB2_PASSWORD=SqlServer2024!
DB2_DATABASE=testdb2

DB1_QUERY=SELECT TOP 500 t.id as transaction_id, c.name as customer_name, p.name as product_name, cat.name as category_name, t.amount as total_amount, t.quantity, t.status as order_status, c.city as customer_location, c.country as customer_region, t.created_at as order_date, (t.amount / t.quantity) as unit_price, CASE WHEN t.amount > 500 THEN 'high_value' WHEN t.amount > 100 THEN 'medium_value' ELSE 'low_value' END as value_tier FROM transactions t INNER JOIN customers c ON t.customer_id = c.id INNER JOIN products p ON t.product_id = p.id INNER JOIN categories cat ON p.category_id = cat.id WHERE t.created_at >= '2024-01-01' ORDER BY t.id

DB2_QUERY=SELECT TOP 500 o.order_id as transaction_id, u.full_name as customer_name, i.item_name as product_name, pt.type_name as category_name, o.total_amount, o.item_count as quantity, o.order_status, u.location as customer_location, u.region as customer_region, o.order_date, (o.total_amount / o.item_count) as unit_price, CASE WHEN o.total_amount > 500 THEN 'high_value' WHEN o.total_amount > 100 THEN 'medium_value' ELSE 'low_value' END as value_tier FROM orders o INNER JOIN users u ON o.user_id = u.user_id INNER JOIN items i ON o.item_id = i.item_id INNER JOIN product_types pt ON i.type_id = pt.type_id WHERE o.order_date >= '2024-01-01' ORDER BY o.order_id

ACCEPTABLE_DELTA=0.01

SA_PASSWORD=SqlServer2024!
EOF
    echo "✅ Created .env file with NestJS-style configuration"
fi

echo ""
echo "🛑 Stopping existing containers..."
docker-compose down -v

echo ""
echo "🚀 Starting SQL Server containers with environment file..."
docker-compose --env-file .env up -d

echo ""
echo "⏳ Waiting for SQL Server initialization (90 seconds)..."
sleep 90

echo ""
echo "🗄️ Creating databases..."
echo "Creating testdb1..."
docker exec sql-comparison-sqlserver1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'SqlServer2024!' -C -Q "CREATE DATABASE testdb1"

echo "Creating testdb2..."
docker exec sql-comparison-sqlserver2 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'SqlServer2024!' -C -Q "CREATE DATABASE testdb2"

echo ""
echo "📊 Running initialization scripts..."
echo "Initializing testdb1..."
docker exec sql-comparison-sqlserver1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'SqlServer2024!' -C -d testdb1 -i /docker-entrypoint-initdb.d/01-init.sql

echo "Initializing testdb2..."
docker exec sql-comparison-sqlserver2 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'SqlServer2024!' -C -d testdb2 -i /docker-entrypoint-initdb.d/01-init.sql

echo ""
echo "🧪 Testing database comparison tool..."
npm test

echo ""
echo "✅ Setup complete! If you see authentication errors, try:"
echo "   1. Press Ctrl+C to cancel any stuck commands"
echo "   2. Run: docker-compose --env-file .env down -v"
echo "   3. Run: docker-compose --env-file .env up -d"
echo "   4. Wait 90 seconds and try again"
