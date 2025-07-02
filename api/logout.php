<?php
session_start();
header('Content-Type: application/json');

require_once '../includes/db_connect.php';

$response = ['success' => false, 'message' => 'An unknown error occurred.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = $_SESSION['user_id'] ?? null;

    if (!$user_id) {
        $response['message'] = 'No active user session to log out.';
        $response['success'] = true; // Consider success if already logged out
        echo json_encode($response);
        exit;
    }

    try {
        // Delete user's profile image file first
        $stmt = $pdo->prepare("SELECT profile_img FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();

        if ($user && !empty($user['profile_img'])) {
            $imagePath = '../uploads/' . $user['profile_img'];
            if (file_exists($imagePath)) {
                unlink($imagePath); // Delete the actual file
            }
        }

        // Delete user's profile and all associated vibe interactions (due to CASCADE DELETE)
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$user_id]);

        // Destroy the PHP session
        session_unset();
        session_destroy();
        $_SESSION = array(); // Clear $_SESSION superglobal

        $response['success'] = true;
        $response['message'] = 'Logged out successfully. Profile deleted.';

    } catch (PDOException $e) {
        error_log("Database error during logout/profile deletion: " . $e->getMessage());
        $response['message'] = 'Database error during logout. Please try again later.';
    } catch (Exception $e) {
        error_log("General error during logout: " . $e->getMessage());
        $response['message'] = 'Server error during logout. Please try again later.';
    }
} else {
    $response['message'] = 'Invalid request method.';
}

echo json_encode($response);
?>