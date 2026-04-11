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
    return $row;
}
