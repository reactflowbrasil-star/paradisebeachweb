<?php

declare(strict_types=1);

require_once __DIR__ . "/common.php";

$pdo = db();
$method = $_SERVER["REQUEST_METHOD"] ?? "GET";
$id = trim((string) ($_GET["id"] ?? ""));

if ($id === "") {
    error_response("ID do cliente e obrigatorio.", 400);
}

if ($method === "GET") {
    $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = :id");
    $stmt->execute([":id" => $id]);
    $row = $stmt->fetch();
    if (!$row) {
        error_response("Cliente nao encontrado.", 404);
    }
    respond(client_row($row));
}

if ($method === "PATCH") {
    $payload = json_input();
    if (!$payload) {
        error_response("Nenhum campo para atualizar.", 400);
    }

    $allowed = [
        "full_name",
        "email",
        "phone",
        "document",
        "document_type",
        "birth_date",
        "nationality",
        "address_line1",
        "address_line2",
        "city",
        "state",
        "country",
        "zip_code",
        "emergency_contact_name",
        "emergency_contact_phone",
        "vip_status",
        "tags_json",
        "profile_photo_url",
        "preferred_payment_method",
        "notes",
    ];

    $fields = [];
    $params = [":id" => $id];
    foreach ($payload as $key => $value) {
        if (!in_array($key, $allowed, true)) {
            continue;
        }
        $fields[] = "{$key} = :{$key}";
        if ($key === "tags_json") {
            $params[":{$key}"] = $value !== null ? json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null;
        } elseif ($key === "vip_status") {
            $params[":{$key}"] = !empty($value) ? 1 : 0;
        } else {
            $params[":{$key}"] = $value;
        }
    }

    if (!$fields) {
        error_response("Nenhum campo valido para atualizar.", 400);
    }

    try {
        $stmt = $pdo->prepare("UPDATE clients SET " . implode(", ", $fields) . " WHERE id = :id");
        $stmt->execute($params);
    } catch (Throwable $e) {
        error_response("Nao foi possivel atualizar cliente. Verifique os dados enviados.", 409);
    }

    $fetch = $pdo->prepare("SELECT * FROM clients WHERE id = :id");
    $fetch->execute([":id" => $id]);
    $row = $fetch->fetch();
    if (!$row) {
        error_response("Cliente nao encontrado.", 404);
    }

    respond(client_row($row));
}

if ($method === "DELETE") {
    $stmt = $pdo->prepare("DELETE FROM clients WHERE id = :id");
    $stmt->execute([":id" => $id]);
    respond_no_content();
}

error_response("Metodo nao permitido.", 405);
