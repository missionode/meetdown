<?php
session_start();
header('Content-Type: application/json');

require_once '../includes/db_connect.php';
require_once '../includes/functions.php'; // Ensure this file exists, even if empty

$response = ['success' => false, 'message' => 'An unknown error occurred.', 'users' => [], 'current_user_id' => null, 'current_user_img' => null, 'sent_vibes_to_users' => []];

if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'User session not found. Please create a profile.';
    echo json_encode($response);
    exit;
}

$current_user_id = $_SESSION['user_id'];
$current_user_lat = $_SESSION['user_lat'];
$current_user_lng = $_SESSION['user_lng'];
$current_user_img = $_SESSION['user_img'];

$response['current_user_id'] = $current_user_id;
$response['current_user_img'] = $current_user_img;

try {
    // Fetch IDs of users the current user has sent vibes to
    $stmtSentVibes = $pdo->prepare("SELECT to_user_id FROM vibe_interactions WHERE from_user_id = ? AND vibe_type = 'coffee'");
    $stmtSentVibes->execute([$current_user_id]);
    $response['sent_vibes_to_users'] = $stmtSentVibes->fetchAll(PDO::FETCH_COLUMN); // Fetches a simple array of IDs

    // Haversine formula constants
    $earthRadius = 6371000; // meters

    // Fetch all users except the current one
    $stmt = $pdo->prepare("SELECT id, name, latitude, longitude, profile_img FROM users WHERE id != ?");
    $stmt->execute([$current_user_id]);
    $allUsers = $stmt->fetchAll();

    $nearbyUsers = [];
    foreach ($allUsers as $user) {
        $lat1 = deg2rad($current_user_lat);
        $lon1 = deg2rad($current_user_lng);
        $lat2 = deg2rad($user['latitude']);
        $lon2 = deg2rad($user['longitude']);

        $dLat = $lat2 - $lat1;
        $dLon = $lon2 - $lon1;

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos($lat1) * cos($lat2) *
             sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        $distance = round($earthRadius * $c); // Distance in meters

        if ($distance <= 250) { // Within 250 meters
            $user['distance'] = $distance;
            $user['is_matched'] = false;
            $user['match_type'] = null; // Will always be 'coffee' if matched
            $user['is_seen'] = false; // Flag to indicate if current user has marked this match as seen

            // Check for mutual match (both parties sent 'coffee' vibe to each other)
            $matchStmt = $pdo->prepare("
                SELECT 
                    vi1.vibe_type,
                    vi1.seen_by_from_user as current_user_has_seen
                FROM vibe_interactions vi1
                JOIN vibe_interactions vi2 ON vi1.from_user_id = vi2.to_user_id 
                                        AND vi1.to_user_id = vi2.from_user_id
                                        AND vi1.vibe_type = vi2.vibe_type
                WHERE vi1.from_user_id = ? AND vi1.to_user_id = ? AND vi1.vibe_type = 'coffee'
            ");
            $matchStmt->execute([$current_user_id, $user['id']]);
            $mutualMatch = $matchStmt->fetch();

            if ($mutualMatch) {
                $user['is_matched'] = true;
                $user['match_type'] = 'coffee'; // Always coffee for matches
                $user['is_seen'] = (bool)$mutualMatch['current_user_has_seen'];
            }

            $nearbyUsers[] = $user;
        }
    }

    // Sorting is handled by JS based on is_seen and distance.
    // No need for usort here now, as JS will fetch and then sort dynamically.
    // However, keeping for initial backend consistency before JS re-sorts.
    usort($nearbyUsers, function($a, $b) {
        return $a['distance'] - $b['distance'];
    });


    $response['success'] = true;
    $response['message'] = 'Users fetched successfully.';
    $response['users'] = $nearbyUsers;

} catch (PDOException $e) {
    error_log("Database error fetching users: " . $e->getMessage());
    $response['message'] = 'Database error. Please try again later.';
} catch (Exception $e) {
    error_log("General error fetching users: " . $e->getMessage());
    $response['message'] = 'Server error. Please try again later.';
}

echo json_encode($response);
?>