<?php

declare(strict_types=1);

require_once __DIR__ . "/common.php";

$pdo = db();
$id = $_GET["id"] ?? "";
if ($id === "") {
    error_response("ID da foto é obrigatório.", 400);
}

$method = $_SERVER["REQUEST_METHOD"] ?? "GET";

if ($method === "PATCH") {
    $payload = json_input();
    if (!$payload) {
        error_response("Nenhum campo para atualizar.", 400);
    }

    if (!empty($payload["cover"])) {
        $lookup = $pdo->prepare("SELECT property_id FROM property_photos WHERE id = :id");
        $lookup->execute([":id" => $id]);
        $row = $lookup->fetch();
        if ($row) {
          $reset = $pdo->prepare("UPDATE property_photos SET cover = 0 WHERE property_id = :property_id");
          $reset->execute([":property_id" => $row["property_id"]]);
        }
    }

    $fields = [];
    $params = [":id" => $id];
    foreach ($payload as $key => $value) {
        if ($key === "published" || $key === "cover") {
            $value = !empty($value) ? 1 : 0;
        }
        $fields[] = "{$key} = :{$key}";
        $params[":{$key}"] = $value;
    }

    $stmt = $pdo->prepare("UPDATE property_photos SET " . implode(", ", $fields) . " WHERE id = :id");
    $stmt->execute($params);

    $fetch = $pdo->prepare("SELECT * FROM property_photos WHERE id = :id");
    $fetch->execute([":id" => $id]);
    $row = $fetch->fetch();
    if (!$row) {
        error_response("Foto não encontrada.", 404);
    }
    respond(photo_row($row));
}

if ($method === "DELETE") {
    $lookup = $pdo->prepare("SELECT * FROM property_photos WHERE id = :id");
    $lookup->execute([":id" => $id]);
    $row = $lookup->fetch();

    if ($row && isset($row["url"])) {
        $root = dirname(__DIR__);
        $filePath = $root . "/" . ltrim((string) $row["url"], "/");
        if (is_file($filePath)) {
            unlink($filePath);
        }
    }

    $stmt = $pdo->prepare("DELETE FROM property_photos WHERE id = :id");
    $stmt->execute([":id" => $id]);
    respond_no_content();
}

error_response("Método não permitido.", 405);
