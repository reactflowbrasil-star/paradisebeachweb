<?php

declare(strict_types=1);

require_once __DIR__ . "/common.php";

$pdo = db();
$method = $_SERVER["REQUEST_METHOD"] ?? "GET";

if ($method === "GET") {
    $rows = $pdo->query("SELECT * FROM settings")->fetchAll();
    $settings = [];
    foreach ($rows as $row) {
        $settings[$row["id"]] = $row["value"];
    }
    respond($settings);
}

if ($method === "POST") {
    $payload = json_input();
    $stmt = $pdo->prepare("INSERT INTO settings (id, value) VALUES (:id, :value) ON DUPLICATE KEY UPDATE value = :value");
    
    foreach ($payload as $key => $value) {
        $stmt->execute([
            ":id" => $key,
            ":value" => (string) $value,
        ]);
    }
    
    respond(["message" => "Configurações atualizadas."]);
}

error_response("Método não permitido.", 405);
