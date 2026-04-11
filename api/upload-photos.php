<?php

declare(strict_types=1);

require_once __DIR__ . "/common.php";

require_method("POST");

$propertyId = $_POST["property_id"] ?? "";
if ($propertyId === "") {
    error_response("property_id é obrigatório.", 400);
}

if (!isset($_FILES["photos"])) {
    error_response("Nenhum arquivo enviado.", 400);
}

$pdo = db();
$root = dirname(__DIR__);
$uploadDir = $root . "/uploads/property-photos";

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

$created = [];
$names = $_FILES["photos"]["name"] ?? [];
$tmpNames = $_FILES["photos"]["tmp_name"] ?? [];
$errors = $_FILES["photos"]["error"] ?? [];

foreach ($names as $index => $name) {
    if (($errors[$index] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        continue;
    }

    $extension = pathinfo((string) $name, PATHINFO_EXTENSION);
    $filename = time() . "-" . bin2hex(random_bytes(4)) . ($extension ? "." . strtolower($extension) : "");
    $destination = $uploadDir . "/" . $filename;

    if (!move_uploaded_file((string) $tmpNames[$index], $destination)) {
        continue;
    }

    $id = uuid_v4();
    $url = "/uploads/property-photos/" . $filename;
    $caption = pathinfo((string) $name, PATHINFO_FILENAME);

    $stmt = $pdo->prepare(
        "INSERT INTO property_photos (id, property_id, url, caption, published, cover, sort_order)
         VALUES (:id, :property_id, :url, :caption, 1, 0, 0)"
    );
    $stmt->execute([
        ":id" => $id,
        ":property_id" => $propertyId,
        ":url" => $url,
        ":caption" => $caption,
    ]);

    $fetch = $pdo->prepare("SELECT * FROM property_photos WHERE id = :id");
    $fetch->execute([":id" => $id]);
    $created[] = photo_row($fetch->fetch() ?: []);
}

respond($created, 201);
