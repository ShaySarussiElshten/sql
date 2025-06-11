USE testdb1;

CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    city VARCHAR(50),
    country VARCHAR(50),
    registration_date DATE
);

CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0
);

CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT
);

INSERT INTO categories (id, name, description) VALUES
(1, 'Electronics', 'Electronic devices and gadgets'),
(2, 'Books', 'Physical and digital books'),
(3, 'Clothing', 'Apparel and accessories'),
(4, 'Home', 'Home and garden items');

INSERT INTO products (id, name, category_id, price, stock_quantity) VALUES
(1, 'Laptop Pro', 1, 1200.00, 50),
(2, 'Programming Book', 2, 45.99, 100),
(3, 'T-Shirt', 3, 25.00, 200),
(4, 'Coffee Maker', 4, 89.99, 30),
(5, 'Smartphone', 1, 699.99, 75),
(6, 'Novel', 2, 15.99, 150),
(7, 'Jeans', 3, 65.00, 80),
(8, 'Desk Lamp', 4, 35.50, 40);

INSERT INTO customers (id, name, email, city, country, registration_date) VALUES
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

INSERT INTO transactions (id, customer_id, product_id, amount, quantity, status, created_at) VALUES
(1, 1, 1, 1200.00, 1, 'completed', '2024-01-01 10:00:00'),
(2, 2, 2, 91.98, 2, 'completed', '2024-01-02 11:30:00'),
(3, 3, 3, 75.00, 3, 'pending', '2024-01-03 14:15:00'),
(4, 4, 4, 89.99, 1, 'completed', '2024-01-04 09:45:00'),
(5, 5, 5, 699.99, 1, 'completed', '2024-01-05 16:20:00'),
(6, 6, 6, 31.98, 2, 'completed', '2024-01-06 12:10:00'),
(7, 7, 7, 130.00, 2, 'completed', '2024-01-07 13:55:00'),
(8, 8, 8, 71.00, 2, 'cancelled', '2024-01-08 15:30:00'),
(9, 9, 1, 1200.00, 1, 'completed', '2024-01-09 11:45:00'),
(10, 10, 2, 45.99, 1, 'completed', '2024-01-10 14:20:00');
