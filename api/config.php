<?php
// Configuracao do backend PHP (cPanel/PHP+MySQL)
// Credenciais sensiveis ficam em api/secrets.php (gitignored).
if (file_exists(__DIR__ . '/secrets.php')) {
  require_once __DIR__ . '/secrets.php';
}
if (!defined('DB_HOST')) {
  define('DB_HOST', 'paradisebeach.com.br');
  define('DB_PORT', 3306);
  define('DB_NAME', 'paradkbs_lp');
  define('DB_USER', 'paradkbs_lp');
  define('DB_PASS', '');
  define('JWT_SECRET', 'CHANGE_ME');
}
define('UPLOAD_DIR', __DIR__ . '/../public/uploads/properties');
define('UPLOAD_URL', '/uploads/properties');

function db(): PDO {
  static $pdo = null;
  if ($pdo === null) {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
  }
  return $pdo;
}

function sendJson($data, $code = 200) {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function readBody(): array {
  $ct = $_SERVER['CONTENT_TYPE'] ?? '';
  $raw = (string) file_get_contents('php://input');
  if (stripos($ct, 'application/json') !== false || (strlen($raw) > 0 && $raw[0] === '{')) {
    $dec = json_decode($raw, true);
    return is_array($dec) ? $dec : [];
  }
  // multipart/form-data ou x-www-form-urlencoded
  return $_POST;
}

function getBearer(): ?string {
  $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (preg_match('/^Bearer\s+(.+)$/i', $h, $m)) return $m[1];
  return null;
}

function base64url_encode($data): string {
  return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function base64url_decode($data): string {
  $pad = strlen($data) % 4;
  if ($pad) $data .= str_repeat('=', 4 - $pad);
  return base64_decode(strtr($data, '-_', '+/'), true);
}

function signToken(array $payload): string {
  $header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
  $body = base64url_encode(json_encode($payload));
  $sig = base64url_encode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
  return "$header.$body.$sig";
}

function verifyToken(?string $token): ?array {
  if (!$token) return null;
  $parts = explode('.', $token);
  if (count($parts) !== 3) return null;
  [$h, $b, $s] = $parts;
  $expected = base64url_encode(hash_hmac('sha256', "$h.$b", JWT_SECRET, true));
  if (!hash_equals($expected, $s)) return null;
  $payload = json_decode(base64url_decode($b), true);
  return is_array($payload) ? $payload : null;
}

function requireAuth(): array {
  $token = verifyToken(getBearer());
  if (!$token) sendJson(['error' => 'Nao autenticado'], 401);
  return $token;
}

function normalizeProperty($row): array {
  return [
    'id' => $row['id'],
    'title' => $row['title'],
    'type' => $row['type'],
    'listing' => $row['listing'],
    'price' => (float) ($row['price'] ?? 0),
    'price_label' => $row['price_label'],
    'location' => $row['location'],
    'city' => $row['city'],
    'state' => $row['state'],
    'description' => $row['description'],
    'bedrooms' => (int) ($row['bedrooms'] ?? 0),
    'bathrooms' => (int) ($row['bathrooms'] ?? 0),
    'area' => (float) ($row['area'] ?? 0),
    'ocean_view' => (bool) ($row['ocean_view'] ?? false),
    'featured' => (bool) ($row['featured'] ?? false),
    'status' => $row['status'],
    'amenities' => isset($row['amenities']) ? (json_decode($row['amenities'], true) ?: []) : [],
    'lat' => $row['lat'] === null ? null : (float) $row['lat'],
    'lng' => $row['lng'] === null ? null : (float) $row['lng'],
    'whatsapp' => $row['whatsapp'],
    'booking_method' => $row['booking_method'],
    'booking_url' => $row['booking_url'],
    'booking_notes' => $row['booking_notes'],
    'min_nights' => (int) ($row['min_nights'] ?? 1),
    'max_guests' => (int) ($row['max_guests'] ?? 1),
    'created_at' => $row['created_at'] ?? null,
    'updated_at' => $row['updated_at'] ?? null,
  ];
}

function listPhotos($propertyId = null): array {
  $pdo = db();
  if ($propertyId) {
    $stmt = $pdo->prepare("SELECT * FROM property_photos WHERE property_id = ? ORDER BY cover DESC, sort_order ASC, created_at ASC");
    $stmt->execute([$propertyId]);
  } else {
    $stmt = $pdo->query("SELECT * FROM property_photos ORDER BY created_at DESC");
  }
  return array_map(function ($row) {
    return [
      'id' => $row['id'],
      'property_id' => $row['property_id'],
      'url' => $row['url'],
      'caption' => $row['caption'],
      'published' => (bool) ($row['published'] ?? true),
      'cover' => (bool) ($row['cover'] ?? false),
      'sort_order' => (int) ($row['sort_order'] ?? 0),
      'created_at' => $row['created_at'] ?? null,
    ];
  }, $stmt->fetchAll());
}
