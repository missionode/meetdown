<?php
// Database connection details for MAMP
$host = 'localhost';
$db   = 'meetdown_db'; // Change this to your actual database name
$user = 'root';       // Change this to your MySQL username (usually 'root' for MAMP)
$pass = 'root';       // Change this to your MySQL password (usually 'root' or empty for MAMP)
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // Log the error to a file (more secure than displaying to user)
    error_log("Database connection failed: " . $e->getMessage(), 0);
    // Display a generic error message to the user
    die('Database connection failed. Please try again later.');
}
?>