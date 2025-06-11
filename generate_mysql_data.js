const fs = require('fs');

const customers = 10;
const products = 8;
const statuses = ['pending', 'completed', 'cancelled'];

let sql = '';
const baseDate = new Date('2024-01-01');

Math.seedrandom = function(seed) {
    let m = 0x80000000; // 2**31;
    let a = 1103515245;
    let c = 12345;
    let state = seed ? seed : Math.floor(Math.random() * (m - 1));
    return function() {
        state = (a * state + c) % m;
        return state / (m - 1);
    };
};

const rng = Math.seedrandom(12345); // Fixed seed for consistency

for (let i = 1; i <= 500; i++) {
    const customerId = ((i - 1) % customers) + 1;
    const productId = ((i - 1) % products) + 1;
    const quantity = Math.floor(rng() * 5) + 1;
    
    const basePrices = [1200.00, 45.99, 25.00, 89.99, 699.99, 15.99, 65.00, 35.50];
    const basePrice = basePrices[productId - 1];
    let amount = basePrice * quantity;
    
    const rand = rng();
    let status = 'completed';
    
    if (rand < 0.60) {
    } else if (rand < 0.85) {
        const delta = (rng() - 0.5) * 0.018; // ±0.009 range (within 0.01 tolerance)
        amount += delta;
        amount = Math.round(amount * 100) / 100;
    } else {
        if (rng() < 0.5) {
            status = rng() < 0.5 ? 'cancelled' : 'pending';
        } else {
            amount *= (rng() * 0.8 + 1.2); // 120-200% of original
            amount = Math.round(amount * 100) / 100;
        }
    }
    
    if (rand < 0.60 && rng() < 0.05) status = 'pending';
    
    const date = new Date(baseDate);
    date.setDate(date.getDate() + Math.floor((i - 1) / 10));
    date.setHours(9 + Math.floor(rng() * 8));
    date.setMinutes(Math.floor(rng() * 60));
    
    const dateStr = date.toISOString().slice(0, 19).replace('T', ' ');
    
    sql += `(${i}, ${customerId}, ${productId}, ${amount.toFixed(2)}, ${quantity}, '${status}', '${dateStr}')`;
    if (i < 500) sql += ',\n';
}

sql += ';';

const finalSql = `SET IDENTITY_INSERT transactions ON;\nINSERT INTO transactions (id, customer_id, product_id, amount, quantity, status, created_at) VALUES\n${sql}\nSET IDENTITY_INSERT transactions OFF;`;
fs.writeFileSync('/home/ubuntu/sql/sqlserver1_transactions.sql', finalSql);
console.log('Generated 500 SQL Server transaction rows with strategic mix');
