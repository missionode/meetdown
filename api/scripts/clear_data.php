<?php
// clear_data.php
// This script is meant to be run via a cron job or scheduled task, NOT directly from the browser.

// Ensure that this script can only be accessed from the command line or a trusted source if deployed.
// For development on localhost, this basic setup is fine.

require_once '../includes/db_connect.php'; // Path to your database connection file

try {
    // Disable foreign key checks temporarily if you have relationships that would prevent truncation
    // TRUNCATE TABLE resets auto-increment, which is often desired.
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE vibe_interactions;");
    $pdo->exec("TRUNCATE TABLE users;");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    // Log the action (optional, but good for debugging)
    $logMessage = "[" . date('Y-m-d H:i:s') . "] App data cleared successfully.\n";
    file_put_contents('/path/to/your/app_clear.log', $logMessage, FILE_APPEND); // Change /path/to/your/app_clear.log to an actual path

    echo "App data cleared successfully.\n";

} catch (PDOException $e) {
    $errorMessage = "[" . date('Y-m-d H:i:s') . "] Database error clearing data: " . $e->getMessage() . "\n";
    file_put_contents('/path/to/your/app_clear_errors.log', $errorMessage, FILE_APPEND); // Log errors
    error_log("Database error clearing app data: " . $e->getMessage());
    echo "Error clearing app data: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    $errorMessage = "[" . date('Y-m-d H:i:s') . "] General error clearing data: " . $e->getMessage() . "\n";
    file_put_contents('/path/to/your/app_clear_errors.log', $errorMessage, FILE_APPEND); // Log errors
    error_log("General error clearing app data: " . $e->getMessage());
    echo "General error clearing app data: " . $e->getMessage() . "\n";
}
?>