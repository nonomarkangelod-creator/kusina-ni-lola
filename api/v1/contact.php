<?php
// ============================================================
// FILE: api/v1/contact.php
// PURPOSE: Accepts and saves contact form messages
// METHOD: POST
// USAGE: POST /api/v1/contact.php
// BODY: JSON { full_name, email, subject, message }
// VERSION: 1.0.0
// ============================================================

// ── Security headers ────────────────────────────────────────
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

// Handle browser preflight check
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

// ── Read and decode JSON body ───────────────────────────────
$body = file_get_contents('php://input');
$data = json_decode($body, true);

if (!$data) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON data received.'
    ]);
    exit;
}

// ── Sanitize inputs ─────────────────────────────────────────
$full_name = trim(htmlspecialchars($data['full_name'] ?? ''));
$email     = trim($data['email']   ?? '');
$subject   = trim(htmlspecialchars($data['subject']  ?? ''));
$message   = trim(htmlspecialchars($data['message']  ?? ''));

// ── Validate inputs ─────────────────────────────────────────
$errors = [];

if (empty($full_name) || strlen($full_name) < 2) {
    $errors[] = 'Full name is required.';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'A valid email address is required.';
}

if (empty($subject) || strlen($subject) < 3) {
    $errors[] = 'Subject is required (minimum 3 characters).';
}

if (empty($message) || strlen($message) < 10) {
    $errors[] = 'Message is required (minimum 10 characters).';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode([
        'success' => false,
        'message' => 'Validation failed.',
        'errors'  => $errors
    ]);
    exit;
}

// ── Save message to database ────────────────────────────────
try {
    $stmt = $pdo->prepare("
        INSERT INTO contact_messages (full_name, email, subject, message)
        VALUES (?, ?, ?, ?)
    ");

    $stmt->execute([$full_name, $email, $subject, $message]);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Message received! We will get back to you within 24 hours.'
    ]);

} catch (PDOException $e) {
    error_log('Contact API Error: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Could not send message. Please try again later.'
    ]);
}