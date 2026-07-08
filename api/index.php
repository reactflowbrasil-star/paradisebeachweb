<?php
require_once __DIR__ . '/config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

function uuidv4(): string {
  $data = random_bytes(16);
  $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
  $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function boolToInt($v): int {
  return $v ? 1 : 0;
}
function nullIfEmpty($v) {
  return ($v === '' || $v === null) ? null : $v;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];
$pdo = null;

try {
  $pdo = db();
} catch (Throwable $e) {
  sendJson(['error' => 'Falha na conexao com o banco de dados'], 500);
}

// GET /api/health
if ($method === 'GET' && $uri === '/api/health') {
  sendJson(['ok' => true]);
}

// POST /api/admin/login
if ($method === 'POST' && $uri === '/api/admin/login') {
  $body = readBody();
  $email = trim($body['email'] ?? '');
  $password = $body['password'] ?? '';
  if (!$email || !$password) sendJson(['error' => 'Informe e-mail e senha'], 400);
  $stmt = $pdo->prepare("SELECT * FROM admins WHERE email = ? LIMIT 1");
  $stmt->execute([$email]);
  $admin = $stmt->fetch();
  if (!$admin || !password_verify($password, $admin['password_hash'])) {
    sendJson(['error' => 'Credenciais invalidas'], 401);
  }
  $token = signToken(['id' => $admin['id'], 'email' => $admin['email']]);
  sendJson(['token' => $token]);
}

// GET /api/admin/me
if ($method === 'GET' && $uri === '/api/admin/me') {
  $auth = requireAuth();
  sendJson(['admin' => ['id' => $auth['id'], 'email' => $auth['email']]]);
}

// GET /api/properties
if ($method === 'GET' && $uri === '/api/properties') {
  $rows = $pdo->query("SELECT * FROM properties ORDER BY featured DESC, created_at DESC")->fetchAll();
  sendJson(['properties' => array_map('normalizeProperty', $rows), 'photos' => listPhotos()]);
}

// GET /api/properties/{id}
if ($method === 'GET' && preg_match('#^/api/properties/([^/]+)$#', $uri, $m)) {
  $stmt = $pdo->prepare("SELECT * FROM properties WHERE id = ? LIMIT 1");
  $stmt->execute([$m[1]]);
  $row = $stmt->fetch();
  if (!$row) sendJson(['error' => 'Imovel nao encontrado'], 404);
  sendJson(['property' => normalizeProperty($row), 'photos' => listPhotos($m[1])]);
}

// POST /api/properties
if ($method === 'POST' && $uri === '/api/properties') {
  requireAuth();
  $b = readBody();
  $id = uuidv4();
  $stmt = $pdo->prepare("INSERT INTO properties (
      id, title, type, listing, price, price_label, location, city, state, description,
      bedrooms, bathrooms, area, ocean_view, featured, status, amenities, lat, lng,
      whatsapp, booking_method, booking_url, booking_notes, min_nights, max_guests
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  $stmt->execute([
    $id, $b['title'] ?? '', $b['type'] ?? 'casa', $b['listing'] ?? 'aluguel',
    (float) ($b['price'] ?? 0), $b['price_label'] ?? null, $b['location'] ?? '', $b['city'] ?? '',
    $b['state'] ?? '', $b['description'] ?? '', (int) ($b['bedrooms'] ?? 0), (int) ($b['bathrooms'] ?? 0),
    (float) ($b['area'] ?? 0), boolToInt($b['ocean_view'] ?? false), boolToInt($b['featured'] ?? false),
    $b['status'] ?? 'disponivel', json_encode($b['amenities'] ?? []), nullIfEmpty($b['lat'] ?? null),
    nullIfEmpty($b['lng'] ?? null), $b['whatsapp'] ?? null, $b['booking_method'] ?? 'whatsapp',
    $b['booking_url'] ?? null, $b['booking_notes'] ?? null, (int) ($b['min_nights'] ?? 1),
    (int) ($b['max_guests'] ?? 1),
  ]);
  sendJson(['id' => $id], 201);
}

// PUT /api/properties/{id}
if ($method === 'PUT' && preg_match('#^/api/properties/([^/]+)$#', $uri, $m)) {
  requireAuth();
  $b = readBody();
  $stmt = $pdo->prepare("UPDATE properties SET
      title=?, type=?, listing=?, price=?, price_label=?, location=?, city=?, state=?, description=?,
      bedrooms=?, bathrooms=?, area=?, ocean_view=?, featured=?, status=?, amenities=?, lat=?, lng=?,
      whatsapp=?, booking_method=?, booking_url=?, booking_notes=?, min_nights=?, max_guests=?
    WHERE id=?");
  $stmt->execute([
    $b['title'] ?? '', $b['type'] ?? 'casa', $b['listing'] ?? 'aluguel', (float) ($b['price'] ?? 0),
    $b['price_label'] ?? null, $b['location'] ?? '', $b['city'] ?? '', $b['state'] ?? '', $b['description'] ?? '',
    (int) ($b['bedrooms'] ?? 0), (int) ($b['bathrooms'] ?? 0), (float) ($b['area'] ?? 0),
    boolToInt($b['ocean_view'] ?? false), boolToInt($b['featured'] ?? false), $b['status'] ?? 'disponivel',
    json_encode($b['amenities'] ?? []), nullIfEmpty($b['lat'] ?? null), nullIfEmpty($b['lng'] ?? null),
    $b['whatsapp'] ?? null, $b['booking_method'] ?? 'whatsapp', $b['booking_url'] ?? null,
    $b['booking_notes'] ?? null, (int) ($b['min_nights'] ?? 1), (int) ($b['max_guests'] ?? 1), $m[1],
  ]);
  sendJson(['ok' => true]);
}

// DELETE /api/properties/{id}
if ($method === 'DELETE' && preg_match('#^/api/properties/([^/]+)$#', $uri, $m)) {
  requireAuth();
  $pdo->prepare("DELETE FROM properties WHERE id = ?")->execute([$m[1]]);
  sendJson(['ok' => true]);
}

// POST /api/properties/{id}/photos
if ($method === 'POST' && preg_match('#^/api/properties/([^/]+)/photos$#', $uri, $m)) {
  requireAuth();
  $propertyId = $m[1];
  if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
  $countStmt = $pdo->prepare("SELECT COUNT(*) AS total FROM property_photos WHERE property_id = ?");
  $countStmt->execute([$propertyId]);
  $sort = (int) ($countStmt->fetch()['total'] ?? 0);
  $inserted = [];
  $files = $_FILES['photos'] ?? [];
  $fileList = isset($files['name']) && is_array($files['name']) ? $files : [];
  foreach ($fileList['name'] as $i => $name) {
    if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;
    if (strpos($files['type'][$i] ?? '', 'image/') !== 0) continue;
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION)) ?: 'jpg';
    $fname = time() . '-' . uuidv4() . '.' . $ext;
    move_uploaded_file($files['tmp_name'][$i], UPLOAD_DIR . '/' . $fname);
    $url = UPLOAD_URL . '/' . $fname;
    $id = uuidv4();
    $pdo->prepare("INSERT INTO property_photos (id, property_id, url, caption, cover, sort_order) VALUES (?,?,?,?,?,?)")
      ->execute([$id, $propertyId, $url, preg_replace('/\.[^.]+$/', '', $name), $sort === 0 ? 1 : 0, $sort]);
    $inserted[] = ['id' => $id, 'url' => $url];
    $sort++;
  }
  sendJson(['photos' => $inserted], 201);
}

// PUT /api/photos/{id}
if ($method === 'PUT' && preg_match('#^/api/photos/([^/]+)$#', $uri, $m)) {
  requireAuth();
  $b = readBody();
  $photoId = $m[1];
  if (!empty($b['cover'])) {
    $sel = $pdo->prepare("SELECT property_id FROM property_photos WHERE id = ?");
    $sel->execute([$photoId]);
    $pr = $sel->fetch();
    if ($pr) {
      $pdo->prepare("UPDATE property_photos SET cover = false WHERE property_id = ?")->execute([$pr['property_id']]);
    }
  }
  $pdo->prepare("UPDATE property_photos SET caption=?, published=?, cover=?, sort_order=? WHERE id=?")
    ->execute([
      $b['caption'] ?? '', ($b['published'] ?? true) ? 1 : 0, !empty($b['cover']) ? 1 : 0,
      (int) ($b['sort_order'] ?? 0), $photoId,
    ]);
  sendJson(['ok' => true]);
}

// DELETE /api/photos/{id}
if ($method === 'DELETE' && preg_match('#^/api/photos/([^/]+)$#', $uri, $m)) {
  requireAuth();
  $photoId = $m[1];
  $sel = $pdo->prepare("SELECT url FROM property_photos WHERE id = ?");
  $sel->execute([$photoId]);
  $row = $sel->fetch();
  $pdo->prepare("DELETE FROM property_photos WHERE id = ?")->execute([$photoId]);
  if ($row && strpos($row['url'], UPLOAD_URL . '/') === 0) {
    @unlink(UPLOAD_DIR . '/' . basename($row['url']));
  }
  sendJson(['ok' => true]);
}

// GET /api/reservations
if ($method === 'GET' && $uri === '/api/reservations') {
  $rows = $pdo->query("SELECT * FROM reservations ORDER BY created_at DESC")->fetchAll();
  sendJson(['reservations' => array_map(function ($r) {
    return [
      'id' => $r['id'], 'property_id' => $r['property_id'], 'guest_name' => $r['guest_name'],
      'email' => $r['email'], 'phone' => $r['phone'], 'check_in' => $r['check_in'],
      'check_out' => $r['check_out'], 'status' => $r['status'], 'total' => (float) ($r['total'] ?? 0),
      'notes' => $r['notes'], 'created_at' => $r['created_at'] ?? null, 'updated_at' => $r['updated_at'] ?? null,
    ];
  }, $rows)]);
}

// POST /api/reservations
if ($method === 'POST' && $uri === '/api/reservations') {
  requireAuth();
  $b = readBody();
  $id = uuidv4();
  $pdo->prepare("INSERT INTO reservations (id, property_id, guest_name, email, phone, check_in, check_out, status, total, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?)")
    ->execute([
      $id, $b['property_id'] ?? null, $b['guest_name'] ?? '', $b['email'] ?? '', $b['phone'] ?? null,
      $b['check_in'] ?? null, $b['check_out'] ?? null, $b['status'] ?? 'pendente',
      (float) ($b['total'] ?? 0), $b['notes'] ?? null,
    ]);
  sendJson(['id' => $id], 201);
}

// PUT /api/reservations/{id}
if ($method === 'PUT' && preg_match('#^/api/reservations/([^/]+)$#', $uri, $m)) {
  requireAuth();
  $b = readBody();
  $pdo->prepare("UPDATE reservations SET status=?, notes=? WHERE id=?")
    ->execute([$b['status'] ?? 'pendente', $b['notes'] ?? null, $m[1]]);
  sendJson(['ok' => true]);
}

// DELETE /api/reservations/{id}
if ($method === 'DELETE' && preg_match('#^/api/reservations/([^/]+)$#', $uri, $m)) {
  requireAuth();
  $pdo->prepare("DELETE FROM reservations WHERE id = ?")->execute([$m[1]]);
  sendJson(['ok' => true]);
}

sendJson(['error' => 'Rota nao encontrada'], 404);
