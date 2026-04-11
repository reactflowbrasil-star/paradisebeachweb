<?php

declare(strict_types=1);

if (!function_exists("str_ends_with")) {
    function str_ends_with(string $haystack, string $needle): bool
    {
        $length = strlen($needle);
        if ($length === 0) {
            return true;
        }
        return substr($haystack, -$length) === $needle;
    }
}

function apply_cors(): void
{
    $allowedOrigins = [
        "https://paradisebeach.com.br",
        "https://www.paradisebeach.com.br",
        "https://paradisebeach.lovable.app",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ];

    $origin = $_SERVER["HTTP_ORIGIN"] ?? "";

    // Also check Referer as fallback (some proxies strip Origin)
    if ($origin === "" && isset($_SERVER["HTTP_REFERER"])) {
        $parsed = parse_url($_SERVER["HTTP_REFERER"]);
        if ($parsed !== false && isset($parsed["scheme"], $parsed["host"])) {
            $origin = $parsed["scheme"] . "://" . $parsed["host"];
            if (isset($parsed["port"])) {
                $origin .= ":" . $parsed["port"];
            }
        }
    }

    $host = parse_url($origin, PHP_URL_HOST) ?? "";
    $isNetlify = str_ends_with($host, ".netlify.app");
    $isLovable = str_ends_with($host, ".lovable.app");

    if (in_array($origin, $allowedOrigins, true) || $isNetlify || $isLovable) {
        header("Access-Control-Allow-Origin: " . $origin);
        header("Vary: Origin");
    }

    // Always send these on every response
    header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Max-Age: 86400");
}

apply_cors();

if (($_SERVER["REQUEST_METHOD"] ?? "GET") === "OPTIONS") {
    http_response_code(204);
    exit;
}

header("Content-Type: application/json; charset=utf-8");

function env_or_default(string $key, string $default): string
{
    $value = getenv($key);
    return $value !== false && $value !== "" ? $value : $default;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = sprintf(
        "mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4",
        env_or_default("DB_HOST", "127.0.0.1"),
        env_or_default("DB_PORT", "3306"),
        env_or_default("DB_NAME", "paradisebeack")
    );

    $pdo = new PDO(
        $dsn,
        env_or_default("DB_USER", "paradisebeack"),
        env_or_default("DB_PASSWORD", "Alexandre2026@@"),
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    return $pdo;
}

function json_input(): array
{
    $raw = file_get_contents("php://input");
    if ($raw === false || $raw === "") {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function respond(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function respond_no_content(): never
{
    http_response_code(204);
    exit;
}

function error_response(string $message, int $status = 400): never
{
    respond(["message" => $message], $status);
}

function require_method(string ...$methods): void
{
    $current = $_SERVER["REQUEST_METHOD"] ?? "GET";
    if (!in_array($current, $methods, true)) {
        error_response("Método não permitido.", 405);
    }
}

function uuid_v4(): string
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf("%s%s-%s-%s-%s-%s%s%s", str_split(bin2hex($data), 4));
}

function property_row(array $row): array
{
    $row["price"] = (float) $row["price"];
    $row["area"] = (float) $row["area"];
    $row["lat"] = $row["lat"] !== null ? (float) $row["lat"] : null;
    $row["lng"] = $row["lng"] !== null ? (float) $row["lng"] : null;
    $row["ocean_view"] = (bool) $row["ocean_view"];
    $row["featured"] = (bool) $row["featured"];
    $row["amenities"] = json_decode((string) ($row["amenities"] ?? "[]"), true) ?: [];
    return $row;
}

function photo_row(array $row): array
{
    $row["published"] = (bool) $row["published"];
    $row["cover"] = (bool) $row["cover"];
    $row["sort_order"] = (int) $row["sort_order"];
    return $row;
}

function reservation_row(array $row): array
{
    $row["total"] = (float) $row["total"];
    $row["paid_amount"] = isset($row["paid_amount"]) ? (float) $row["paid_amount"] : 0.0;
    $row["client_id"] = $row["client_id"] ?? null;
    $row["booking_code"] = $row["booking_code"] ?? null;
    $row["adults_count"] = isset($row["adults_count"]) ? (int) $row["adults_count"] : 1;
    $row["children_count"] = isset($row["children_count"]) ? (int) $row["children_count"] : 0;
    $row["infants_count"] = isset($row["infants_count"]) ? (int) $row["infants_count"] : 0;
    $row["special_requests"] = $row["special_requests"] ?? null;
    $row["payment_method"] = $row["payment_method"] ?? null;
    $row["payment_status"] = $row["payment_status"] ?? "pendente";
    $row["payment_due_date"] = $row["payment_due_date"] ?? null;
    $row["payment_reference"] = $row["payment_reference"] ?? null;
    $row["payment_installments"] = isset($row["payment_installments"]) ? (int) $row["payment_installments"] : 1;
    $row["payment_receipt_url"] = $row["payment_receipt_url"] ?? null;
    $row["payment_gateway"] = $row["payment_gateway"] ?? null;
    $row["payment_metadata"] = isset($row["payment_metadata"]) && $row["payment_metadata"] !== null
        ? (json_decode((string) $row["payment_metadata"], true) ?: null)
        : null;
    $row["payment_notes"] = $row["payment_notes"] ?? null;
    $row["pre_checkin_status"] = $row["pre_checkin_status"] ?? "pendente";
    $row["pre_checkin_confirmed_at"] = $row["pre_checkin_confirmed_at"] ?? null;
    $row["pre_checkin_due_at"] = $row["pre_checkin_due_at"] ?? null;
    $row["pre_checkin_notes"] = $row["pre_checkin_notes"] ?? null;
    $row["notes"] = $row["notes"] ?? null;
    $row["guests"] = $row["guests"] ?? [];
    $row["payments"] = $row["payments"] ?? [];
    return $row;
}

function client_row(array $row): array
{
    $row["phone"] = $row["phone"] ?? null;
    $row["document"] = $row["document"] ?? null;
    $row["document_type"] = $row["document_type"] ?? null;
    $row["birth_date"] = $row["birth_date"] ?? null;
    $row["nationality"] = $row["nationality"] ?? null;
    $row["address_line1"] = $row["address_line1"] ?? null;
    $row["address_line2"] = $row["address_line2"] ?? null;
    $row["city"] = $row["city"] ?? null;
    $row["state"] = $row["state"] ?? null;
    $row["country"] = $row["country"] ?? null;
    $row["zip_code"] = $row["zip_code"] ?? null;
    $row["emergency_contact_name"] = $row["emergency_contact_name"] ?? null;
    $row["emergency_contact_phone"] = $row["emergency_contact_phone"] ?? null;
    $row["vip_status"] = isset($row["vip_status"]) ? (bool) $row["vip_status"] : false;
    $row["tags_json"] = isset($row["tags_json"]) && $row["tags_json"] !== null
        ? (json_decode((string) $row["tags_json"], true) ?: [])
        : null;
    $row["profile_photo_url"] = $row["profile_photo_url"] ?? null;
    $row["preferred_payment_method"] = $row["preferred_payment_method"] ?? null;
    $row["notes"] = $row["notes"] ?? null;
    return $row;
}

function reservation_guest_row(array $row): array
{
    $row["client_id"] = $row["client_id"] ?? null;
    $row["email"] = $row["email"] ?? null;
    $row["phone"] = $row["phone"] ?? null;
    $row["document"] = $row["document"] ?? null;
    $row["birth_date"] = $row["birth_date"] ?? null;
    $row["guest_type"] = $row["guest_type"] ?? "adulto";
    $row["is_primary"] = isset($row["is_primary"]) ? (bool) $row["is_primary"] : false;
    $row["notes"] = $row["notes"] ?? null;
    return $row;
}

function reservation_payment_row(array $row): array
{
    $row["amount"] = isset($row["amount"]) ? (float) $row["amount"] : 0.0;
    $row["currency"] = $row["currency"] ?? "BRL";
    $row["reference_code"] = $row["reference_code"] ?? null;
    $row["external_transaction_id"] = $row["external_transaction_id"] ?? null;
    $row["installments"] = isset($row["installments"]) ? (int) $row["installments"] : 1;
    $row["due_at"] = $row["due_at"] ?? null;
    $row["paid_at"] = $row["paid_at"] ?? null;
    $row["pix_qr_code"] = $row["pix_qr_code"] ?? null;
    $row["pix_copy_paste"] = $row["pix_copy_paste"] ?? null;
    $row["card_brand"] = $row["card_brand"] ?? null;
    $row["card_last4"] = $row["card_last4"] ?? null;
    $row["receipt_url"] = $row["receipt_url"] ?? null;
    $row["notes"] = $row["notes"] ?? null;
    $row["metadata"] = isset($row["metadata"]) && $row["metadata"] !== null
        ? (json_decode((string) $row["metadata"], true) ?: null)
        : null;
    return $row;
}

function reservation_guests(PDO $pdo, string $reservationId): array
{
    $stmt = $pdo->prepare("SELECT * FROM reservation_guests WHERE reservation_id = :reservation_id ORDER BY is_primary DESC, created_at ASC");
    $stmt->execute([":reservation_id" => $reservationId]);
    return array_map("reservation_guest_row", $stmt->fetchAll());
}

function reservation_payments(PDO $pdo, string $reservationId): array
{
    $stmt = $pdo->prepare("SELECT * FROM reservation_payments WHERE reservation_id = :reservation_id ORDER BY created_at ASC");
    $stmt->execute([":reservation_id" => $reservationId]);
    return array_map("reservation_payment_row", $stmt->fetchAll());
}

function hydrate_reservation(PDO $pdo, array $row): array
{
    $reservation = reservation_row($row);
    if (!isset($reservation["id"]) || $reservation["id"] === "") {
        return $reservation;
    }
    $reservation["guests"] = reservation_guests($pdo, (string) $reservation["id"]);
    $reservation["payments"] = reservation_payments($pdo, (string) $reservation["id"]);
    return $reservation;
}
