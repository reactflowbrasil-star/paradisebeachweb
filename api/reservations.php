<?php

declare(strict_types=1);

require_once __DIR__ . "/common.php";

$pdo = db();
$method = $_SERVER["REQUEST_METHOD"] ?? "GET";

if ($method === "GET") {
    $rows = $pdo->query("SELECT * FROM reservations ORDER BY created_at DESC")->fetchAll();
    respond(array_map("reservation_row", $rows));
}

if ($method === "POST") {
    $payload = json_input();
    $id = uuid_v4();
    $stmt = $pdo->prepare(
        "INSERT INTO reservations (
            id, property_id, guest_name, email, check_in, check_out, status, total, notes
        ) VALUES (
            :id, :property_id, :guest_name, :email, :check_in, :check_out, :status, :total, :notes
        )"
    );
    $stmt->execute([
        ":id" => $id,
        ":property_id" => $payload["property_id"] ?? "",
        ":guest_name" => $payload["guest_name"] ?? "",
        ":email" => $payload["email"] ?? "",
        ":check_in" => $payload["check_in"] ?? "",
        ":check_out" => $payload["check_out"] ?? "",
        ":status" => $payload["status"] ?? "pendente",
        ":total" => (float) ($payload["total"] ?? 0),
        ":notes" => $payload["notes"] ?? null,
    ]);

    $fetch = $pdo->prepare("SELECT * FROM reservations WHERE id = :id");
    $fetch->execute([":id" => $id]);
    $row = $fetch->fetch();
    respond(reservation_row($row ?: []), 201);
}

error_response("Método não permitido.", 405);
