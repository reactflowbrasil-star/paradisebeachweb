<?php

declare(strict_types=1);

require_once __DIR__ . "/common.php";

require_method("GET");

$rows = db()->query("SELECT * FROM property_photos ORDER BY created_at DESC")->fetchAll();
respond(array_map("photo_row", $rows));
