<?php

declare(strict_types=1);

require_once __DIR__ . "/../common.php";

require_method("POST");

$payload = json_input();
$email = trim((string) ($payload["email"] ?? ""));
$password = (string) ($payload["password"] ?? "");

if ($email === "" || $password === "") {
    error_response("E-mail e senha são obrigatórios.", 400);
}

$pdo = db();

// Check for user in DB
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
$stmt->execute([":email" => $email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, (string) ($user["password"] ?? ""))) {
    // Fallback for static admin (convenience during migration)
    $adminEmail = env_or_default("ADMIN_EMAIL", "admin@paradisebeach.com.br");
    $adminPassword = env_or_default("ADMIN_PASSWORD", "Alexandre2026@@");

    if ($email === $adminEmail && $password === $adminPassword) {
        $user = [
            "id" => "admin-uuid",
            "name" => "Administrador",
            "email" => $adminEmail,
            "role" => "admin"
        ];
    } else {
        error_response("E-mail ou senha incorretos.", 401);
    }
}

respond([
    "user" => [
        "id" => $user["id"],
        "name" => $user["name"] ?? "Usuário",
        "email" => $user["email"],
        "role" => $user["role"] ?? "user"
    ],
    "token" => base64_encode($user["id"] . ":" . bin2hex(random_bytes(16))),
]);
