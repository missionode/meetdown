<?php
session_start();
header('Content-Type: application/json');

require_once '../includes/db_connect.php';

$response = ['success' => false, 'message' => 'An unknown error occurred.', 'is_match' => false];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $from_user_id = $_SESSION['user_id'] ?? null;
    $to_user_id = $input['to_user_id'] ?? null;
    // $vibe_type = $input['vibe_type'] ?? null; // No longer needed from input directly

    // Force vibe_type to 'coffee' as it's the only option now
    $vibe_type = 'coffee'; 

    if (!$from_user_id || !$to_user_id) {
        $response['message'] = 'Invalid request data or session not found.';
        echo json_encode($response);
        exit;
    }

    if ($from_user_id == $to_user_id) {
        $response['message'] = 'Cannot send vibe to yourself.';
        echo json_encode($response);
        exit;
    }

    try {
        // First, check if this specific vibe already exists from_user_id to to_user_id
        $stmt = $pdo->prepare("SELECT id FROM vibe_interactions WHERE from_user_id = ? AND to_user_id = ? AND vibe_type = ?");
        $stmt->execute([$from_user_id, $to_user_id, $vibe_type]); // $vibe_type is 'coffee'
        if ($stmt->fetch()) {
            $response['message'] = 'You have already sent a vibe to this user.';
            $response['success'] = true; // Still a "success" from user perspective, just no new action
            echo json_encode($response);
            exit;
        }

        // Insert the vibe interaction
        $stmt = $pdo->prepare("INSERT INTO vibe_interactions (from_user_id, to_user_id, vibe_type) VALUES (?, ?, ?)");
        $stmt->execute([$from_user_id, $to_user_id, $vibe_type]);

        // Now, check for a mutual match
        // A mutual match exists if the target user (to_user_id) has also sent the SAME vibe_type back to the current user (from_user_id)
        $matchStmt = $pdo->prepare("SELECT id FROM vibe_interactions WHERE from_user_id = ? AND to_user_id = ? AND vibe_type = ?");
        $matchStmt->execute([$to_user_id, $from_user_id, $vibe_type]); // Note: from and to are swapped here for the mutual check

        if ($matchStmt->fetch()) {
            $response['is_match'] = true;
            $response['message'] = 'Mutual match found!';
        }

        $response['success'] = true;
        $response['message'] = $response['is_match'] ? $response['message'] : 'Vibe sent successfully!';

    } catch (PDOException $e) {
        // Check for duplicate entry error (specific to UNIQUE KEY `unique_vibe` on `(from_user_id, to_user_id, vibe_type)`)
        if ($e->getCode() == 23000) { // SQLSTATE for integrity constraint violation
            $response['message'] = 'You have already sent a vibe to this user.';
            $response['success'] = true; // Consider it a success if it's just a duplicate send attempt
        } else {
            error_log("Database error sending vibe: " . $e->getMessage());
            $response['message'] = 'Database error. Please try again later.';
        }
    } catch (Exception $e) {
        error_log("General error sending vibe: " . $e->getMessage());
        $response['message'] = 'Server error. Please try again later.';
    }
} else {
    $response['message'] = 'Invalid request method.';
}

echo json_encode($response);
?>