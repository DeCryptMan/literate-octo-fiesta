<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// Allow CORS for local preview (adjust origins as needed)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    exit;
}

header('Access-Control-Allow-Origin: *');

$basePath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
$uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

if ($basePath !== '' && str_starts_with($uriPath, $basePath)) {
    $uriPath = substr($uriPath, strlen($basePath));
}

$uriPath = '/' . ltrim($uriPath, '/');

try {
    route($uriPath);
} catch (Throwable $exception) {
    respond(
        500,
        [
            'status' => 'error',
            'message' => 'Internal server error. Please try again later.',
            'details' => $exception->getMessage(),
        ]
    );
}

function route(string $uriPath): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    $routes = [
        'GET' => [
            '/' => fn () => respond(200, ['status' => 'ok', 'message' => 'Backend router online']),
            '/health' => fn () => respond(200, ['status' => 'ok', 'timestamp' => time()]),
        ],
        'POST' => [
            '/contact' => fn () => handleContact(),
            '/applications/mentor' => fn () => handleApplication('mentor'),
            '/applications/mentee' => fn () => handleApplication('mentee'),
        ],
    ];

    if (!isset($routes[$method])) {
        respond(405, ['status' => 'error', 'message' => 'Method not allowed']);
    }

    $normalized = rtrim($uriPath, '/') ?: '/';

    if (!isset($routes[$method][$normalized])) {
        respond(404, ['status' => 'error', 'message' => 'Route not found']);
    }

    $routes[$method][$normalized]();
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input') ?: '';

    if ($raw === '') {
        respond(400, ['status' => 'error', 'message' => 'Request body is empty']);
    }

    $data = json_decode($raw, true);

    if (!is_array($data)) {
        respond(400, ['status' => 'error', 'message' => 'Invalid JSON payload']);
    }

    return $data;
}

function handleContact(): void
{
    $payload = readJsonBody();

    $record = [
        'type' => 'contact',
        'role' => sanitizeString($payload['role'] ?? 'other'),
        'fullName' => sanitizeString($payload['fullName'] ?? ''),
        'email' => filter_var(trim((string)($payload['email'] ?? '')), FILTER_VALIDATE_EMAIL),
        'phone' => sanitizeString($payload['phone'] ?? ''),
        'message' => sanitizeString($payload['message'] ?? ''),
        'submittedAt' => gmdate('c'),
    ];

    if (!$record['fullName'] || !$record['email'] || !$record['message']) {
        respond(422, ['status' => 'error', 'message' => 'Required fields are missing or invalid']);
    }

    $record['reference'] = generateReference('CNT');
    $stored = persistRecord('contact_submissions', $record);

    respond(201, [
        'status' => 'ok',
        'reference' => $record['reference'],
        'data' => $stored,
    ]);
}

function handleApplication(string $role): void
{
    $payload = readJsonBody();

    $record = [
        'type' => 'application',
        'role' => $role,
        'fullName' => sanitizeString($payload['fullName'] ?? ''),
        'email' => filter_var(trim((string)($payload['email'] ?? '')), FILTER_VALIDATE_EMAIL),
        'experience' => sanitizeString($payload['experience'] ?? ''),
        'interests' => sanitizeString($payload['interests'] ?? ''),
        'availability' => sanitizeString($payload['availability'] ?? ''),
        'submittedAt' => gmdate('c'),
    ];

    if (!$record['fullName'] || !$record['email']) {
        respond(422, ['status' => 'error', 'message' => 'Full name and valid email are required']);
    }

    $record['reference'] = generateReference($role === 'mentor' ? 'MTR' : 'MTE');
    $stored = persistRecord('program_applications', $record);

    respond(201, [
        'status' => 'ok',
        'reference' => $record['reference'],
        'data' => $stored,
    ]);
}

function sanitizeString(string $value): string
{
    return trim(strip_tags($value));
}

function storageDir(): string
{
    $dir = dirname(__DIR__) . '/storage';
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }

    return $dir;
}

function persistRecord(string $namespace, array $record): array
{
    $file = storageDir() . '/' . $namespace . '.json';

    $existing = [];
    if (file_exists($file)) {
        $decoded = json_decode(file_get_contents($file) ?: '[]', true);
        if (is_array($decoded)) {
            $existing = $decoded;
        }
    }

    $existing[] = $record;

    file_put_contents($file, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    return $record;
}

function generateReference(string $prefix): string
{
    return sprintf('%s-%s-%04d', $prefix, gmdate('Ymd'), random_int(0, 9999));
}

function respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
