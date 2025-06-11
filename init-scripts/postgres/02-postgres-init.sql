CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    item_count INT NOT NULL DEFAULT 1,
    order_status VARCHAR(20) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email_address VARCHAR(150) UNIQUE,
    location VARCHAR(50),
    region VARCHAR(50),
    signup_date DATE
);

CREATE TABLE items (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    type_id INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    available_stock INT DEFAULT 0
);

CREATE TABLE product_types (
    type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL,
    type_description TEXT
);

INSERT INTO product_types (type_id, type_name, type_description) VALUES
(1, 'Electronics', 'Electronic devices and gadgets'),
(2, 'Books', 'Physical and digital books'),
(3, 'Clothing', 'Apparel and accessories'),
(4, 'Home', 'Home and garden items');

INSERT INTO items (item_id, item_name, type_id, unit_price, available_stock) VALUES
(1, 'Laptop Pro', 1, 1200.00, 45),
(2, 'Programming Book', 2, 45.99, 95),
(3, 'T-Shirt', 3, 25.00, 180),
(4, 'Coffee Maker', 4, 89.99, 25),
(5, 'Smartphone', 1, 699.99, 70),
(6, 'Novel', 2, 15.99, 140),
(7, 'Jeans', 3, 65.00, 75),
(8, 'Desk Lamp', 4, 35.50, 35);

INSERT INTO users (user_id, full_name, email_address, location, region, signup_date) VALUES
(1, 'John Smith', 'john.smith@email.com', 'New York', 'USA', '2023-01-15'),
(2, 'Jane Doe', 'jane.doe@email.com', 'London', 'UK', '2023-02-20'),
(3, 'Bob Johnson', 'bob.johnson@email.com', 'Toronto', 'Canada', '2023-03-10'),
(4, 'Alice Brown', 'alice.brown@email.com', 'Sydney', 'Australia', '2023-04-05'),
(5, 'Charlie Wilson', 'charlie.wilson@email.com', 'Berlin', 'Germany', '2023-05-12'),
(6, 'Diana Davis', 'diana.davis@email.com', 'Paris', 'France', '2023-06-18'),
(7, 'Frank Miller', 'frank.miller@email.com', 'Tokyo', 'Japan', '2023-07-22'),
(8, 'Grace Lee', 'grace.lee@email.com', 'Seoul', 'South Korea', '2023-08-30'),
(9, 'Henry Taylor', 'henry.taylor@email.com', 'Madrid', 'Spain', '2023-09-14'),
(10, 'Ivy Chen', 'ivy.chen@email.com', 'Singapore', 'Singapore', '2023-10-25');

INSERT INTO orders (order_id, user_id, item_id, total_amount, item_count, order_status, order_date) VALUES
(1, 1, 1, 1200.00, 1, 'completed', '2024-01-01 10:00:00'),  -- Exact match
(2, 2, 2, 91.99, 2, 'completed', '2024-01-02 11:30:00'),   -- Small delta (91.98 vs 91.99)
(3, 3, 3, 75.00, 3, 'pending', '2024-01-03 14:15:00'),     -- Exact match
(4, 4, 4, 89.99, 1, 'completed', '2024-01-04 09:45:00'),   -- Exact match
(5, 5, 5, 700.00, 1, 'completed', '2024-01-05 16:20:00'),  -- Small delta (699.99 vs 700.00)
(6, 6, 6, 31.99, 2, 'completed', '2024-01-06 12:10:00'),   -- Small delta (31.98 vs 31.99)
(7, 7, 7, 130.00, 2, 'completed', '2024-01-07 13:55:00'),  -- Exact match
(8, 8, 8, 150.00, 2, 'cancelled', '2024-01-08 15:30:00'),  -- Significant mismatch (71.00 vs 150.00)
(9, 9, 1, 1200.00, 1, 'completed', '2024-01-09 11:45:00'), -- Exact match
(10, 10, 2, 45.99, 1, 'completed', '2024-01-10 14:20:00'), -- Exact match
(11, 1, 3, 50.00, 2, 'completed', '2024-01-11 09:15:00'),  -- Exact match
(12, 2, 4, 179.99, 2, 'completed', '2024-01-12 14:30:00'), -- Small delta (179.98 vs 179.99)
(13, 3, 5, 699.99, 1, 'pending', '2024-01-13 11:45:00'),   -- Exact match
(14, 4, 6, 47.99, 3, 'completed', '2024-01-14 16:20:00'),  -- Small delta (47.98 vs 47.99)
(15, 5, 7, 195.00, 3, 'completed', '2024-01-15 10:30:00'), -- Exact match
(16, 6, 8, 106.50, 3, 'completed', '2024-01-16 13:45:00'), -- Exact match
(17, 7, 1, 1200.00, 1, 'completed', '2024-01-17 15:00:00'), -- Small delta (1199.99 vs 1200.00)
(18, 8, 2, 91.99, 2, 'completed', '2024-01-18 12:15:00'),  -- Significant mismatch (status: cancelled vs completed)
(19, 9, 3, 75.00, 3, 'completed', '2024-01-19 14:45:00'),  -- Exact match
(20, 10, 4, 89.99, 1, 'pending', '2024-01-20 11:30:00'),   -- Exact match
(21, 1, 5, 1400.00, 2, 'completed', '2024-01-21 16:00:00'), -- Small delta (1399.99 vs 1400.00)
(22, 2, 6, 95.99, 6, 'completed', '2024-01-22 09:45:00'),  -- Small delta (95.97 vs 95.99)
(23, 3, 7, 260.00, 4, 'completed', '2024-01-23 13:20:00'), -- Exact match
(24, 4, 8, 142.00, 4, 'completed', '2024-01-24 15:30:00'), -- Exact match
(25, 5, 1, 2400.00, 2, 'completed', '2024-01-25 10:15:00'), -- Exact match
(26, 6, 2, 137.99, 3, 'pending', '2024-01-26 12:45:00'),   -- Small delta (137.97 vs 137.99)
(27, 7, 3, 125.00, 5, 'completed', '2024-01-27 14:00:00'), -- Exact match
(28, 8, 4, 269.99, 3, 'completed', '2024-01-28 16:30:00'), -- Small delta (269.97 vs 269.99)
(29, 9, 5, 1400.00, 2, 'completed', '2024-01-29 11:00:00'), -- Small delta (1399.98 vs 1400.00)
(30, 10, 6, 159.95, 5, 'cancelled', '2024-01-30 13:15:00'); -- Significant mismatch (79.95 vs 159.95)
