<?php

declare(strict_types=1);

require_once __DIR__ . "/common.php";

$pdo = db();
$method = $_SERVER["REQUEST_METHOD"] ?? "GET";

if ($method === "GET") {
    $rows = $pdo->query("SELECT * FROM clients ORDER BY created_at DESC")->fetchAll();
    respond(array_map("client_row", $rows));
}

if ($method === "POST") {
    $payload = json_input();
    $fullName = trim((string) ($payload["full_name"] ?? ""));
    $email = trim((string) ($payload["email"] ?? ""));

    if ($fullName === "") {
        error_response("Nome completo e obrigatorio.", 400);
    }
    if ($email === "") {
        error_response("E-mail e obrigatorio.", 400);
    }

    $id = uuid_v4();
    $stmt = $pdo->prepare(
        "INSERT INTO clients (
            id, full_name, email, phone, document, document_type, birth_date, nationality,
            address_line1, address_line2, city, state, country, zip_code,
            emergency_contact_name, emergency_contact_phone, vip_status, tags_json,
            profile_photo_url, preferred_payment_method, notes
        ) VALUES (
            :id, :full_name, :email, :phone, :document, :document_type, :birth_date, :nationality,
            :address_line1, :address_line2, :city, :state, :country, :zip_code,
            :emergency_contact_name, :emergency_contact_phone, :vip_status, :tags_json,
            :profile_photo_url, :preferred_payment_method, :notes
        )"
    );

    try {
        $stmt->execute([
            ":id" => $id,
            ":full_name" => $fullName,
            ":email" => $email,
            ":phone" => ($payload["phone"] ?? null) ?: null,
            ":document" => ($payload["document"] ?? null) ?: null,
            ":document_type" => ($payload["document_type"] ?? null) ?: null,
            ":birth_date" => ($payload["birth_date"] ?? null) ?: null,
            ":nationality" => ($payload["nationality"] ?? null) ?: null,
            ":address_line1" => ($payload["address_line1"] ?? null) ?: null,
            ":address_line2" => ($payload["address_line2"] ?? null) ?: null,
            ":city" => ($payload["city"] ?? null) ?: null,
            ":state" => ($payload["state"] ?? null) ?: null,
            ":country" => ($payload["country"] ?? null) ?: null,
            ":zip_code" => ($payload["zip_code"] ?? null) ?: null,
            ":emergency_contact_name" => ($payload["emergency_contact_name"] ?? null) ?: null,
            ":emergency_contact_phone" => ($payload["emergency_contact_phone"] ?? null) ?: null,
            ":vip_status" => !empty($payload["vip_status"]) ? 1 : 0,
            ":tags_json" => isset($payload["tags_json"]) ? json_encode($payload["tags_json"], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
            ":profile_photo_url" => ($payload["profile_photo_url"] ?? null) ?: null,
            ":preferred_payment_method" => ($payload["preferred_payment_method"] ?? null) ?: null,
            ":notes" => ($payload["notes"] ?? null) ?: null,
        ]);
    } catch (Throwable $e) {
        error_response("Nao foi possivel cadastrar cliente. Verifique se o e-mail ja existe.", 409);
    }

    $fetch = $pdo->prepare("SELECT * FROM clients WHERE id = :id");
    $fetch->execute([":id" => $id]);
    $row = $fetch->fetch();
    respond(client_row($row ?: []), 201);
}

error_response("Metodo nao permitido.", 405);
