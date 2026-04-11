<?php

declare(strict_types=1);

require_once __DIR__ . "/common.php";
require_method("PATCH");

function sync_patch_reservation_guests(PDO $pdo, string $reservationId, array $guests, ?string $clientId = null): void
{
    $pdo->prepare("DELETE FROM reservation_guests WHERE reservation_id = :reservation_id")->execute([":reservation_id" => $reservationId]);
    $stmt = $pdo->prepare(
        "INSERT INTO reservation_guests (
            id, reservation_id, client_id, full_name, email, phone, document, birth_date, guest_type, is_primary, notes
        ) VALUES (
            :id, :reservation_id, :client_id, :full_name, :email, :phone, :document, :birth_date, :guest_type, :is_primary, :notes
        )"
    );
    foreach ($guests as $index => $guest) {
        $stmt->execute([
            ":id" => uuid_v4(),
            ":reservation_id" => $reservationId,
            ":client_id" => ($guest["client_id"] ?? null) ?: ($index === 0 ? $clientId : null),
            ":full_name" => trim((string) ($guest["full_name"] ?? "")),
            ":email" => ($guest["email"] ?? null) ?: null,
            ":phone" => ($guest["phone"] ?? null) ?: null,
            ":document" => ($guest["document"] ?? null) ?: null,
            ":birth_date" => ($guest["birth_date"] ?? null) ?: null,
            ":guest_type" => $guest["guest_type"] ?? "adulto",
            ":is_primary" => !empty($guest["is_primary"]) ? 1 : 0,
            ":notes" => ($guest["notes"] ?? null) ?: null,
        ]);
    }
}

function sync_patch_reservation_payments(PDO $pdo, string $reservationId, array $payments): void
{
    $pdo->prepare("DELETE FROM reservation_payments WHERE reservation_id = :reservation_id")->execute([":reservation_id" => $reservationId]);
    $stmt = $pdo->prepare(
        "INSERT INTO reservation_payments (
            id, reservation_id, method, status, amount, currency, reference_code, external_transaction_id, installments,
            due_at, paid_at, pix_qr_code, pix_copy_paste, card_brand, card_last4, receipt_url, notes, metadata
        ) VALUES (
            :id, :reservation_id, :method, :status, :amount, :currency, :reference_code, :external_transaction_id, :installments,
            :due_at, :paid_at, :pix_qr_code, :pix_copy_paste, :card_brand, :card_last4, :receipt_url, :notes, :metadata
        )"
    );
    foreach ($payments as $payment) {
        $metadata = $payment["metadata"] ?? null;
        $stmt->execute([
            ":id" => uuid_v4(),
            ":reservation_id" => $reservationId,
            ":method" => $payment["method"] ?? "pix",
            ":status" => $payment["status"] ?? "pendente",
            ":amount" => (float) ($payment["amount"] ?? 0),
            ":currency" => $payment["currency"] ?? "BRL",
            ":reference_code" => ($payment["reference_code"] ?? null) ?: null,
            ":external_transaction_id" => ($payment["external_transaction_id"] ?? null) ?: null,
            ":installments" => (int) ($payment["installments"] ?? 1),
            ":due_at" => ($payment["due_at"] ?? null) ?: null,
            ":paid_at" => ($payment["paid_at"] ?? null) ?: null,
            ":pix_qr_code" => ($payment["pix_qr_code"] ?? null) ?: null,
            ":pix_copy_paste" => ($payment["pix_copy_paste"] ?? null) ?: null,
            ":card_brand" => ($payment["card_brand"] ?? null) ?: null,
            ":card_last4" => ($payment["card_last4"] ?? null) ?: null,
            ":receipt_url" => ($payment["receipt_url"] ?? null) ?: null,
            ":notes" => ($payment["notes"] ?? null) ?: null,
            ":metadata" => $metadata !== null ? json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
        ]);
    }
}

$pdo = db();
$id = $_GET["id"] ?? "";
if ($id === "") {
    error_response("ID da reserva e obrigatorio.", 400);
}

$payload = json_input();
if (!$payload) {
    error_response("Nenhum campo para atualizar.", 400);
}

if (isset($payload["check_in"], $payload["check_out"]) && strtotime((string) $payload["check_out"]) <= strtotime((string) $payload["check_in"])) {
    error_response("Check-out deve ser posterior ao check-in.", 400);
}

$allowed = [
    "property_id",
    "client_id",
    "booking_code",
    "guest_name",
    "email",
    "check_in",
    "check_out",
    "status",
    "adults_count",
    "children_count",
    "infants_count",
    "special_requests",
    "payment_method",
    "payment_status",
    "paid_amount",
    "total",
    "payment_due_date",
    "payment_reference",
    "payment_installments",
    "payment_receipt_url",
    "payment_gateway",
    "payment_metadata",
    "payment_notes",
    "pre_checkin_status",
    "pre_checkin_confirmed_at",
    "pre_checkin_due_at",
    "pre_checkin_notes",
    "notes",
];

$fields = [];
$params = [":id" => $id];
foreach ($payload as $key => $value) {
    if (!in_array($key, $allowed, true)) {
        continue;
    }
    $fields[] = "{$key} = :{$key}";
    if ($key === "payment_metadata" && $value !== null && $value !== "") {
        $params[":{$key}"] = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    } else {
        $params[":{$key}"] = $value;
    }
}

if ($fields) {
    $stmt = $pdo->prepare("UPDATE reservations SET " . implode(", ", $fields) . " WHERE id = :id");
    $stmt->execute($params);
}

$currentStmt = $pdo->prepare("SELECT * FROM reservations WHERE id = :id");
$currentStmt->execute([":id" => $id]);
$current = $currentStmt->fetch();
if (!$current) {
    error_response("Reserva nao encontrada.", 404);
}

if (array_key_exists("guests", $payload) && is_array($payload["guests"])) {
    sync_patch_reservation_guests($pdo, $id, $payload["guests"], ($payload["client_id"] ?? $current["client_id"] ?? null) ?: null);
}

if (array_key_exists("payments", $payload) && is_array($payload["payments"])) {
    sync_patch_reservation_payments($pdo, $id, $payload["payments"]);
}

$fetch = $pdo->prepare("SELECT * FROM reservations WHERE id = :id");
$fetch->execute([":id" => $id]);
$row = $fetch->fetch();
respond(hydrate_reservation($pdo, $row ?: []));
