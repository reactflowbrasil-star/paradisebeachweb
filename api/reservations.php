<?php

declare(strict_types=1);

require_once __DIR__ . "/common.php";

function booking_code(): string
{
    return "PB-" . date("Ymd") . "-" . strtoupper(substr(bin2hex(random_bytes(3)), 0, 6));
}

function default_pre_checkin_due_at(string $checkIn): string
{
    $date = new DateTimeImmutable($checkIn . " 12:00:00");
    return $date->modify("-2 days")->format("Y-m-d H:i:s");
}

function sync_reservation_guests(PDO $pdo, string $reservationId, array $guests, ?string $clientId = null): void
{
    $pdo->prepare("DELETE FROM reservation_guests WHERE reservation_id = :reservation_id")->execute([":reservation_id" => $reservationId]);

    $insert = $pdo->prepare(
        "INSERT INTO reservation_guests (
            id, reservation_id, client_id, full_name, email, phone, document, birth_date, guest_type, is_primary, notes
        ) VALUES (
            :id, :reservation_id, :client_id, :full_name, :email, :phone, :document, :birth_date, :guest_type, :is_primary, :notes
        )"
    );

    foreach ($guests as $index => $guest) {
        $insert->execute([
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

function sync_reservation_payments(PDO $pdo, string $reservationId, array $payments): void
{
    $pdo->prepare("DELETE FROM reservation_payments WHERE reservation_id = :reservation_id")->execute([":reservation_id" => $reservationId]);

    $insert = $pdo->prepare(
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
        $insert->execute([
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
$method = $_SERVER["REQUEST_METHOD"] ?? "GET";

if ($method === "GET") {
    $clientId = trim((string) ($_GET["client_id"] ?? ""));
    if ($clientId !== "") {
        $stmt = $pdo->prepare("SELECT * FROM reservations WHERE client_id = :client_id ORDER BY created_at DESC");
        $stmt->execute([":client_id" => $clientId]);
        $rows = $stmt->fetchAll();
    } else {
        $rows = $pdo->query("SELECT * FROM reservations ORDER BY created_at DESC")->fetchAll();
    }
    respond(array_map(fn(array $row): array => hydrate_reservation($pdo, $row), $rows));
}

if ($method === "POST") {
    $payload = json_input();
    $clientId = ($payload["client_id"] ?? null) ?: null;
    $guestName = trim((string) ($payload["guest_name"] ?? ""));
    $guestEmail = trim((string) ($payload["email"] ?? ""));

    if (($payload["property_id"] ?? "") === "") {
        error_response("Imovel e obrigatorio.", 400);
    }
    if (($payload["check_in"] ?? "") === "" || ($payload["check_out"] ?? "") === "") {
        error_response("Check-in e check-out sao obrigatorios.", 400);
    }
    if (strtotime((string) $payload["check_out"]) <= strtotime((string) $payload["check_in"])) {
        error_response("Check-out deve ser posterior ao check-in.", 400);
    }

    if ($clientId !== null && ($guestName === "" || $guestEmail === "")) {
        $clientStmt = $pdo->prepare("SELECT full_name, email FROM clients WHERE id = :id");
        $clientStmt->execute([":id" => $clientId]);
        $clientRow = $clientStmt->fetch();
        if ($clientRow) {
            if ($guestName === "") {
                $guestName = (string) ($clientRow["full_name"] ?? "");
            }
            if ($guestEmail === "") {
                $guestEmail = (string) ($clientRow["email"] ?? "");
            }
        }
    }

    if ($guestName === "" || $guestEmail === "") {
        error_response("Hospede principal e e-mail sao obrigatorios.", 400);
    }

    $id = uuid_v4();
    $bookingCode = trim((string) ($payload["booking_code"] ?? "")) ?: booking_code();
    $preCheckinDueAt = ($payload["pre_checkin_due_at"] ?? null) ?: default_pre_checkin_due_at((string) $payload["check_in"]);
    $paymentMetadata = $payload["payment_metadata"] ?? null;

    $stmt = $pdo->prepare(
        "INSERT INTO reservations (
            id, property_id, client_id, booking_code, guest_name, email, check_in, check_out, status,
            adults_count, children_count, infants_count, special_requests,
            payment_method, payment_status, paid_amount, total, payment_due_date, payment_reference,
            payment_installments, payment_receipt_url, payment_gateway, payment_metadata, payment_notes,
            pre_checkin_status, pre_checkin_confirmed_at, pre_checkin_due_at, pre_checkin_notes, notes
        ) VALUES (
            :id, :property_id, :client_id, :booking_code, :guest_name, :email, :check_in, :check_out, :status,
            :adults_count, :children_count, :infants_count, :special_requests,
            :payment_method, :payment_status, :paid_amount, :total, :payment_due_date, :payment_reference,
            :payment_installments, :payment_receipt_url, :payment_gateway, :payment_metadata, :payment_notes,
            :pre_checkin_status, :pre_checkin_confirmed_at, :pre_checkin_due_at, :pre_checkin_notes, :notes
        )"
    );

    $stmt->execute([
        ":id" => $id,
        ":property_id" => $payload["property_id"],
        ":client_id" => $clientId,
        ":booking_code" => $bookingCode,
        ":guest_name" => $guestName,
        ":email" => $guestEmail,
        ":check_in" => $payload["check_in"],
        ":check_out" => $payload["check_out"],
        ":status" => $payload["status"] ?? "pendente",
        ":adults_count" => (int) ($payload["adults_count"] ?? 1),
        ":children_count" => (int) ($payload["children_count"] ?? 0),
        ":infants_count" => (int) ($payload["infants_count"] ?? 0),
        ":special_requests" => ($payload["special_requests"] ?? null) ?: null,
        ":payment_method" => ($payload["payment_method"] ?? null) ?: null,
        ":payment_status" => $payload["payment_status"] ?? "pendente",
        ":paid_amount" => (float) ($payload["paid_amount"] ?? 0),
        ":total" => (float) ($payload["total"] ?? 0),
        ":payment_due_date" => ($payload["payment_due_date"] ?? null) ?: null,
        ":payment_reference" => ($payload["payment_reference"] ?? null) ?: null,
        ":payment_installments" => (int) ($payload["payment_installments"] ?? 1),
        ":payment_receipt_url" => ($payload["payment_receipt_url"] ?? null) ?: null,
        ":payment_gateway" => ($payload["payment_gateway"] ?? null) ?: null,
        ":payment_metadata" => $paymentMetadata !== null ? json_encode($paymentMetadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
        ":payment_notes" => ($payload["payment_notes"] ?? null) ?: null,
        ":pre_checkin_status" => $payload["pre_checkin_status"] ?? "pendente",
        ":pre_checkin_confirmed_at" => ($payload["pre_checkin_confirmed_at"] ?? null) ?: null,
        ":pre_checkin_due_at" => $preCheckinDueAt,
        ":pre_checkin_notes" => ($payload["pre_checkin_notes"] ?? null) ?: null,
        ":notes" => ($payload["notes"] ?? null) ?: null,
    ]);

    $guests = is_array($payload["guests"] ?? null) ? $payload["guests"] : [];
    if (!$guests) {
        $guests[] = [
            "client_id" => $clientId,
            "full_name" => $guestName,
            "email" => $guestEmail,
            "guest_type" => "adulto",
            "is_primary" => true,
        ];
    }
    sync_reservation_guests($pdo, $id, $guests, $clientId);

    $payments = is_array($payload["payments"] ?? null) ? $payload["payments"] : [];
    if (!$payments && ($payload["payment_method"] ?? null)) {
        $payments[] = [
            "method" => $payload["payment_method"],
            "status" => $payload["payment_status"] ?? "pendente",
            "amount" => (float) ($payload["total"] ?? 0),
            "installments" => (int) ($payload["payment_installments"] ?? 1),
            "reference_code" => ($payload["payment_reference"] ?? null) ?: null,
            "receipt_url" => ($payload["payment_receipt_url"] ?? null) ?: null,
            "due_at" => ($payload["payment_due_date"] ?? null) ?: null,
            "notes" => ($payload["payment_notes"] ?? null) ?: null,
        ];
    }
    sync_reservation_payments($pdo, $id, $payments);

    $fetch = $pdo->prepare("SELECT * FROM reservations WHERE id = :id");
    $fetch->execute([":id" => $id]);
    $row = $fetch->fetch();
    respond(hydrate_reservation($pdo, $row ?: []), 201);
}

error_response("Metodo nao permitido.", 405);
