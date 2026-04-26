<?php
// ============================================================
// FILE: config/db.php
// PURPOSE: Connects PHP to MySQL using PDO (secure method)
// ============================================================

// ── Load .env file manually (no framework needed) ──────────
// Reads each line of .env and sets it as an environment variable
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comment lines that start with #
        if (str_starts_with(trim($line), '#')) continue;

        // Split on first = sign only
        if (strpos($line, '=') !== false) {
            [$key, $value] = explode('=', $line, 2);
            $key   = trim($key);
            $value = trim($value, " \t\n\r\0\x0B\"'"); // remove quotes/spaces
            $_ENV[$key] = $value;
        }
    }
}

// ── For credentials from environment ──────────────────────
$host   = $_ENV['DB_HOST'] ?? 'localhost';
$dbname = $_ENV['DB_NAME'] ?? 'kusina_db';
$user   = $_ENV['DB_USER'] ?? 'root';
$pass   = $_ENV['DB_PASS'] ?? '';

// ── PDO connection ───────────────────────────────────
try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [
            // Throw exceptions on errors instead of silent failures
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,

            // Return rows as associative arrays (e.g. $row['name'])
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

            // Disable emulated prepares for true security
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    // This log the real error server-side, show a safe message to the user
    error_log('DB Connection Error: ' . $e->getMessage());

    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'A database error occurred. Please try again later.'
    ]);
    exit;
}
?>