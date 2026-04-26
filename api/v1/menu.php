<?php
// ============================================================
// FILE: api/v1/menu.php
// PURPOSE: Returns menu items as JSON
// METHOD: GET
// USAGE: /api/v1/menu.php
//        /api/v1/menu.php?category=mains
// VERSION: 1.0.0
// ============================================================

// ── Security headers ────────────────────────────────────────
// Tell the browser this is JSON, not HTML
header('Content-Type: application/json');

// Allow frontend (same server) to call this API
// In production, replace * with your actual domain
header('Access-Control-Allow-Origin: *');

// Only allow GET requests to this endpoint
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405); // 405 = Method Not Allowed
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use GET.'
    ]);
    exit;
}

// ── Load database connection ────────────────────────────────
// __DIR__ = this file's folder (api/v1/)
// We go up two levels (/../../../) to reach project root
require_once __DIR__ . '/../../config/db.php';

// ── Read optional ?category= filter from URL ────────────────
// e.g. /api/v1/menu.php?category=mains
// filter_input() is safer than $_GET — it sanitizes the value
$category = filter_input(INPUT_GET, 'category', FILTER_SANITIZE_SPECIAL_CHARS);

try {
    if ($category) {
        // ── Filtered query: get items by category ──────────
        // NEVER put $category directly in SQL — use ? placeholder
        // This is called a "prepared statement" — it prevents SQL injection
        $stmt = $pdo->prepare("
            SELECT id, name, description, price, category, image_url, is_available
            FROM menu_items
            WHERE category = ? AND is_available = 1
            ORDER BY name ASC
        ");
        $stmt->execute([$category]);
    } else {
        // ── Default query: get all available items ──────────
        $stmt = $pdo->query("
            SELECT id, name, description, price, category, image_url, is_available
            FROM menu_items
            WHERE is_available = 1
            ORDER BY category ASC, name ASC
        ");
    }

    $items = $stmt->fetchAll();

    // ── Format price as float for clean JSON output ─────────
    foreach ($items as &$item) {
        $item['price'] = (float) $item['price'];
        $item['is_available'] = (bool) $item['is_available'];
    }

    // ── Send success response ───────────────────────────────
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'count'   => count($items),
        'data'    => $items
    ]);

} catch (PDOException $e) {
    // Log real error privately, send safe message to browser
    error_log('Menu API Error: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Could not load menu. Please try again later.'
    ]);
}