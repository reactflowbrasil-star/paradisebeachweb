<?php

declare(strict_types=1);

require_once __DIR__ . "/common.php";

$pdo = db();
$method = $_SERVER["REQUEST_METHOD"] ?? "GET";

if ($method === "GET") {
    $rows = $pdo->query("SELECT * FROM properties ORDER BY created_at DESC")->fetchAll();
    respond(array_map("property_row", $rows));
}

if ($method === "POST") {
    $payload = json_input();
    $id = uuid_v4();
    $stmt = $pdo->prepare(
        "INSERT INTO properties (
            id, title, type, listing, price, price_label, location, city, state, description,
            bedrooms, bathrooms, area, ocean_view, featured, status, amenities, lat, lng, whatsapp
        ) VALUES (
            :id, :title, :type, :listing, :price, :price_label, :location, :city, :state, :description,
            :bedrooms, :bathrooms, :area, :ocean_view, :featured, :status, :amenities, :lat, :lng, :whatsapp
        )"
    );
    $stmt->execute([
        ":id" => $id,
        ":title" => $payload["title"] ?? "",
        ":type" => $payload["type"] ?? "casa",
        ":listing" => $payload["listing"] ?? "aluguel",
        ":price" => (float) ($payload["price"] ?? 0),
        ":price_label" => $payload["price_label"] ?? null,
        ":location" => $payload["location"] ?? "",
        ":city" => $payload["city"] ?? "",
        ":state" => $payload["state"] ?? "",
        ":description" => $payload["description"] ?? "",
        ":bedrooms" => (int) ($payload["bedrooms"] ?? 0),
        ":bathrooms" => (int) ($payload["bathrooms"] ?? 0),
        ":area" => (float) ($payload["area"] ?? 0),
        ":ocean_view" => !empty($payload["ocean_view"]) ? 1 : 0,
        ":featured" => !empty($payload["featured"]) ? 1 : 0,
        ":status" => $payload["status"] ?? "disponivel",
        ":amenities" => json_encode($payload["amenities"] ?? []),
        ":lat" => $payload["lat"] ?? null,
        ":lng" => $payload["lng"] ?? null,
        ":whatsapp" => $payload["whatsapp"] ?? null,
    ]);

    $fetch = $pdo->prepare("SELECT * FROM properties WHERE id = :id");
    $fetch->execute([":id" => $id]);
    $row = $fetch->fetch();
    respond(property_row($row ?: []), 201);
}

error_response("Método não permitido.", 405);
