const fs = require('fs');

const users = 10;
const items = 8;
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

const rng = Math.seedrandom(12345); // Same seed as MySQL for coordination

const basePrices = [1200.00, 45.99, 25.00, 89.99, 699.99, 15.99, 65.00, 35.50];

for (let i = 1; i <= 500; i++) {
    const userId = ((i - 1) % users) + 1;
    const itemId = ((i - 1) % items) + 1;
    const quantity = Math.floor(rng() * 5) + 1; // Same quantity logic as MySQL
    
    const basePrice = basePrices[itemId - 1];
    let amount = basePrice * quantity;
    
    const rand = rng();
    let status = 'completed';
    
    if (rand < 0.60) {
    } else if (rand < 0.85) {
        const delta = (rng() - 0.5) * 0.018; // Same delta range as MySQL
        amount += delta + 0.001; // Slight offset to create delta difference
        amount = Math.round(amount * 100) / 100;
    } else {
        if (rng() < 0.5) {
            status = rng() < 0.5 ? 'cancelled' : 'pending';
        } else {
            amount *= (rng() * 0.6 + 1.4); // 140-200% of original (different from MySQL)
            amount = Math.round(amount * 100) / 100;
        }
    }
    
    if (rand < 0.60 && rng() < 0.05) status = 'pending';
    
    const date = new Date(baseDate);
    date.setDate(date.getDate() + Math.floor((i - 1) / 10));
    date.setHours(9 + Math.floor(rng() * 8));
    date.setMinutes(Math.floor(rng() * 60));
    
    const dateStr = date.toISOString().slice(0, 19).replace('T', ' ');
    
    sql += `(${i}, ${userId}, ${itemId}, ${amount.toFixed(2)}, ${quantity}, '${status}', '${dateStr}')`;
    if (i < 500) sql += ',\n';
}

sql += ';';

const finalSql = `SET IDENTITY_INSERT orders ON;\nINSERT INTO orders (order_id, user_id, item_id, total_amount, item_count, order_status, order_date) VALUES\n${sql}\nSET IDENTITY_INSERT orders OFF;`;
fs.writeFileSync('/home/ubuntu/sql/sqlserver2_orders.sql', finalSql);
console.log('Generated 500 SQL Server order rows with coordinated strategic mix');
