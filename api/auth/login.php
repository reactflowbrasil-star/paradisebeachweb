<?php

declare(strict_types=1);

require_once __DIR__ . "/../common.php";

require_method("POST");

$payload = json_input();
$email = $payload["email"] ?? "";
$password = $payload["password"] ?? "";

$adminEmail = env_or_default("ADMIN_EMAIL", "admin@paradisebeach.com.br");
$adminPassword = env_or_default("ADMIN_PASSWORD", "Alexandre2026@@");

if ($email !== $adminEmail || $password !== $adminPassword) {
    error_response("Credenciais inválidas.", 401);
}

respond([
    "user" => ["email" => $adminEmail],
    "token" => base64_encode($adminEmail . ":ok"),
]);
