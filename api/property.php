<?php

declare(strict_types=1);

require_once __DIR__ . "/common.php";

$pdo = db();
$id = $_GET["id"] ?? "";
if ($id === "") {
    error_response("ID do imóvel é obrigatório.", 400);
}

$method = $_SERVER["REQUEST_METHOD"] ?? "GET";

if ($method === "GET") {
    $stmt = $pdo->prepare("SELECT * FROM properties WHERE id = :id");
    $stmt->execute([":id" => $id]);
    $row = $stmt->fetch();
    if (!$row) {
        error_response("Imóvel não encontrado.", 404);
    }
    respond(property_row($row));
}

if ($method === "PATCH") {
    $payload = json_input();
    if (!$payload) {
        error_response("Nenhum campo para atualizar.", 400);
    }

    $fields = [];
    $params = [":id" => $id];
    foreach ($payload as $key => $value) {
        if ($key === "amenities") {
            $value = json_encode($value ?? []);
        }
        if ($key === "featured" || $key === "ocean_view") {
            $value = !empty($value) ? 1 : 0;
        }
        $fields[] = "{$key} = :{$key}";
        $params[":{$key}"] = $value;
    }

    $stmt = $pdo->prepare("UPDATE properties SET " . implode(", ", $fields) . " WHERE id = :id");
    $stmt->execute($params);

    $fetch = $pdo->prepare("SELECT * FROM properties WHERE id = :id");
    $fetch->execute([":id" => $id]);
    $row = $fetch->fetch();
    if (!$row) {
        error_response("Imóvel não encontrado.", 404);
    }
    respond(property_row($row));
}

if ($method === "DELETE") {
    $stmt = $pdo->prepare("DELETE FROM properties WHERE id = :id");
    $stmt->execute([":id" => $id]);
    respond_no_content();
}

error_response("Método não permitido.", 405);
