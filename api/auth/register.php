<?php

declare(strict_types=1);

require_once __DIR__ . "/../common.php";

require_method("POST");

$payload = json_input();
$name = trim((string) ($payload["name"] ?? ""));
$email = trim((string) ($payload["email"] ?? ""));
$password = (string) ($payload["password"] ?? "");

if ($name === "" || $email === "" || $password === "") {
    error_response("Todos os campos são obrigatórios.", 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    error_response("E-mail inválido.", 400);
}

if (strlen($password) < 6) {
    error_response("A senha deve ter pelo menos 6 caracteres.", 400);
}

$pdo = db();

$check = $pdo->prepare("SELECT id FROM users WHERE email = :email");
$check->execute([":email" => $email]);
if ($check->fetch()) {
    error_response("Este e-mail já está cadastrado.", 409);
}

$id = uuid_v4();
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("INSERT INTO users (id, name, email, password, role) VALUES (:id, :name, :email, :password, :role)");
$stmt->execute([
    ":id" => $id,
    ":name" => $name,
    ":email" => $email,
    ":password" => $hashedPassword,
    ":role" => "user",
]);

respond([
    "user" => [
        "id" => $id,
        "name" => $name,
        "email" => $email,
        "role" => "user"
    ],
    "message" => "Usuário registrado com sucesso."
], 201);
