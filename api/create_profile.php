<?php
session_start();
header('Content-Type: application/json');

require_once '../includes/db_connect.php';
require_once '../includes/functions.php'; // For utility functions if any

$response = ['success' => false, 'message' => 'An unknown error occurred.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'] ?? '';
    $latitude = $_POST['latitude'] ?? '';
    $longitude = $_POST['longitude'] ?? '';
    $profileImage = $_FILES['profile_image'] ?? null;

    // Basic validation
    if (empty($name) || !is_numeric($latitude) || !is_numeric($longitude) || $profileImage === null || $profileImage['error'] !== UPLOAD_ERR_OK) {
        $response['message'] = 'Invalid data provided or image upload failed. Error code: ' . ($profileImage['error'] ?? 'N/A');
        echo json_encode($response);
        exit;
    }

    $uploadDir = '../uploads/';
    // Ensure upload directory exists
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true); // Create recursively with full permissions
    }

    $imageFileName = uniqid('profile_') . '.' . pathinfo($profileImage['name'], PATHINFO_EXTENSION);
    $imageFilePath = $uploadDir . $imageFileName;

    // Move uploaded file
    if (move_uploaded_file($profileImage['tmp_name'], $imageFilePath)) {
        // Save user to database
        $stmt = $pdo->prepare("INSERT INTO users (name, latitude, longitude, profile_img) VALUES (?, ?, ?, ?)");
        if ($stmt->execute([$name, $latitude, $longitude, $imageFileName])) {
            $user_id = $pdo->lastInsertId();
            $_SESSION['user_id'] = $user_id; // Store user ID in session
            $_SESSION['user_name'] = $name;
            $_SESSION['user_lat'] = $latitude;
            $_SESSION['user_lng'] = $longitude;
            $_SESSION['user_img'] = $imageFileName;


            $response['success'] = true;
            $response['message'] = 'Profile created successfully!';
            $response['user_id'] = $user_id; // Return user ID
        } else {
            // Delete uploaded file if DB insert fails
            unlink($imageFilePath);
            $response['message'] = 'Failed to save profile to database.';
        }
    } else {
        $response['message'] = 'Failed to upload profile image.';
    }
} else {
    $response['message'] = 'Invalid request method.';
}

echo json_encode($response);
?>