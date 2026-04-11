<?php
require_once __DIR__ . "/common.php";

$pdo = db();

$statements = [
    "ALTER TABLE properties ADD COLUMN lat DECIMAL(10,8) DEFAULT NULL",
    "ALTER TABLE properties ADD COLUMN lng DECIMAL(11,8) DEFAULT NULL",
    "ALTER TABLE properties ADD COLUMN whatsapp VARCHAR(20) DEFAULT NULL",
    "ALTER TABLE properties ADD COLUMN address VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE properties ADD COLUMN cep VARCHAR(20) DEFAULT NULL"
];

$results = [];
foreach ($statements as $sql) {
    try {
        $pdo->exec($sql);
        $results[] = ["sql" => $sql, "status" => "success"];
    } catch (Throwable $e) {
        $results[] = ["sql" => $sql, "status" => "error", "message" => $e->getMessage()];
    }
}

respond(["migration" => "done", "details" => $results]);
