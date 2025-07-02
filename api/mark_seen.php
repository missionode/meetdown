<?php
session_start();
header('Content-Type: application/json');

require_once '../includes/db_connect.php';

$response = ['success' => false, 'message' => 'An unknown error occurred.'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $from_user_id = $_SESSION['user_id'] ?? null; // Current user
    $to_user_id = $input['to_user_id'] ?? null; // User whose match is being marked seen

    if (!$from_user_id || !$to_user_id) {
        $response['message'] = 'Invalid request data or session not found.';
        echo json_encode($response);
        exit;
    }

    try {
        // Update the 'seen_by_from_user' flag for the specific interaction
        // where current user (from_user_id) sent a vibe to the target user (to_user_id)
        // AND there's a mutual match (implied by the match icon presence, though we can re-verify if needed)
        // We set it to true for any mutual vibe type.
        $stmt = $pdo->prepare("
            UPDATE vibe_interactions
            SET seen_by_from_user = TRUE
            WHERE from_user_id = ? AND to_user_id = ?
            AND EXISTS (SELECT 1 FROM vibe_interactions WHERE from_user_id = ? AND to_user_id = ? AND vibe_type = vibe_interactions.vibe_type)
        ");
        // The `EXISTS` clause ensures we're only marking as seen if there's a confirmed mutual vibe of the same type.
        $stmt->execute([$from_user_id, $to_user_id, $to_user_id, $from_user_id]);

        if ($stmt->rowCount() > 0) {
            $response['success'] = true;
            $response['message'] = 'Match marked as seen.';
        } else {
            $response['message'] = 'Could not mark match as seen (possibly no mutual match or already seen).';
        }

    } catch (PDOException $e) {
        error_log("Database error marking seen: " . $e->getMessage());
        $response['message'] = 'Database error. Please try again later.';
    } catch (Exception $e) {
        error_log("General error marking seen: " . $e->getMessage());
        $response['message'] = 'Server error. Please try again later.';
    }
} else {
    $response['message'] = 'Invalid request method.';
}

echo json_encode($response);
?>