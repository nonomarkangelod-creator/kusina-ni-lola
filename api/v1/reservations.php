<?php
// ============================================================
// FILE: api/v1/reservations.php
// PURPOSE: Accepts and saves table reservation requests
// METHOD: POST
// USAGE: POST /api/v1/reservations.php
// BODY: JSON { full_name, email, phone, party_size, date, time, notes }
// VERSION: 1.0.0
// ============================================================

// ── Security headers ────────────────────────────────────────
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request (sent by browsers before POST)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST.'
    ]);
    exit;
}

// ── Load database connection ────────────────────────────────
require_once __DIR__ . '/../../config/db.php';

// ── Read JSON body sent from the frontend ───────────────────
// The browser sends data as JSON in the request body
$body = file_get_contents('php://input');
$data = json_decode($body, true); // true = return as array

// Check if JSON was valid
if (!$data) {
    http_response_code(400); // 400 = Bad Request
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON data received.'
    ]);
    exit;
}

// ── Sanitize and validate all inputs ────────────────────────
// NEVER trust data from the user — always validate server-side
$full_name  = trim(htmlspecialchars($data['full_name']  ?? ''));
$email      = trim($data['email']      ?? '');
$phone      = trim(htmlspecialchars($data['phone']      ?? ''));
$party_size = (int) ($data['party_size'] ?? 0);
$date       = trim($data['date']       ?? '');
$time       = trim($data['time']       ?? '');
$notes      = trim(htmlspecialchars($data['notes']      ?? ''));

// ── Validation rules ────────────────────────────────────────
$errors = [];

if (empty($full_name) || strlen($full_name) < 2) {
    $errors[] = 'Full name is required (minimum 2 characters).';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'A valid email address is required.';
}

if (empty($phone)) {
    $errors[] = 'Phone number is required.';
}

if ($party_size < 1 || $party_size > 20) {
    $errors[] = 'Party size must be between 1 and 20.';
}

if (empty($date) || strtotime($date) < strtotime('today')) {
    $errors[] = 'Please select a valid future date.';
}

if (empty($time)) {
    $errors[] = 'Reservation time is required.';
}

// If any validation failed, return all errors
if (!empty($errors)) {
    http_response_code(422); // 422 = Unprocessable Entity
    echo json_encode([
        'success' => false,
        'message' => 'Validation failed.',
        'errors'  => $errors
    ]);
    exit;
}

// ── Save to database using prepared statement ────────────────
try {
    $stmt = $pdo->prepare("
        INSERT INTO reservations (full_name, email, phone, party_size, date, time, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $full_name,
        $email,
        $phone,
        $party_size,
        $date,
        $time,
        $notes
    ]);

    // Get the ID of the newly created reservation
    $newId = $pdo->lastInsertId();

    http_response_code(201); // 201 = Created
    echo json_encode([
        'success'        => true,
        'message'        => 'Reservation received! We will confirm shortly.',
        'reservation_id' => $newId
    ]);

} catch (PDOException $e) {
    error_log('Reservations API Error: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Could not save reservation. Please try again later.'
    ]);
}