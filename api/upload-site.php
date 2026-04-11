<?php

declare(strict_types=1);

require_once __DIR__ . "/common.php";

require_method("POST");

if (!isset($_FILES["photo"])) {
    error_response("Nenhum arquivo enviado.", 400);
}

// Ensure the directory exists
$uploadDir = __DIR__ . "/../uploads/site/";
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0775, true);
}

$file = $_FILES["photo"];
$name = basename($file["name"]);
$tmpName = $file["tmp_name"];
$error = $file["error"];

if ($error !== UPLOAD_ERR_OK) {
    error_response("Erro no upload do arquivo.", 400);
}

$ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
$validExts = ["jpg", "jpeg", "png", "webp"];
if (!in_array($ext, $validExts, true)) {
    error_response("Formato inválido. Apenas JPG, PNG e WebP.", 400);
}

$filename = time() . "-" . bin2hex(random_bytes(4)) . "." . $ext;
$dest = $uploadDir . $filename;

if (!move_uploaded_file($tmpName, $dest)) {
    error_response("Falha ao mover o arquivo.", 500);
}

$url = "/uploads/site/" . $filename;

respond(["url" => $url]);
