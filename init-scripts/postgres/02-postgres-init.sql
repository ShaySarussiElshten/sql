CREATE TABLE orders (
    transaction_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO orders (transaction_id, customer_name, total_amount, timestamp) VALUES
(1, 'John Smith', 100.00, '2024-01-01 10:00:00'),
(2, 'Jane Doe', 250.51, '2024-01-02 11:30:00'),
(3, 'Robert Johnson', 75.25, '2024-01-03 14:15:00'),
(4, 'Alice Brown', 500.00, '2024-01-04 09:45:00'),
(5, 'Charlie Wilson', 125.80, '2024-01-05 16:20:00'),
(6, 'Diana Davis', 299.99, '2024-01-06 12:10:00'),
(7, 'Frank Miller', 450.25, '2024-01-07 13:55:00'),
(8, 'Grace Lee', 180.00, '2024-01-08 15:30:00'),
(9, 'Henry Taylor', 225.00, '2024-01-09 11:45:00'),
(10, 'Ivy Chen', 350.75, '2024-01-10 14:20:00');
