<?php

declare(strict_types=1);

require_once __DIR__ . "/common.php";

require_method("PATCH");

$pdo = db();
$id = $_GET["id"] ?? "";
if ($id === "") {
    error_response("ID da reserva é obrigatório.", 400);
}

$payload = json_input();
if (!$payload) {
    error_response("Nenhum campo para atualizar.", 400);
}

$fields = [];
$params = [":id" => $id];
foreach ($payload as $key => $value) {
    $fields[] = "{$key} = :{$key}";
    $params[":{$key}"] = $value;
}

$stmt = $pdo->prepare("UPDATE reservations SET " . implode(", ", $fields) . " WHERE id = :id");
$stmt->execute($params);

$fetch = $pdo->prepare("SELECT * FROM reservations WHERE id = :id");
$fetch->execute([":id" => $id]);
$row = $fetch->fetch();
if (!$row) {
    error_response("Reserva não encontrada.", 404);
}

respond(reservation_row($row));
