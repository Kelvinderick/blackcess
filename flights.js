// Blackcess Admin — Flight management (add/edit/delete flights, routes,
// prices, seats). Operates on the internal `flights` table — this is the
// inventory used as a fallback for bookings that don't come through the
// live Duffel search (see admin/booking.js's comment on Duffel bookings).
//
// SCHEMA NOTE: this assumes `flights` has the columns referenced below.
// flight_number, departure_city, arrival_city, departure_time, and
// arrival_time already exist (used elsewhere in the app). If price,
// currency, seats_available, cabin_class, departure_code, arrival_code,
// or status don't exist yet, run this once in the Supabase SQL editor:
//
//   ALTER TABLE flights
//     ADD COLUMN IF NOT EXISTS departure_code text,
//     ADD COLUMN IF NOT EXISTS arrival_code text,
//     ADD COLUMN IF NOT EXISTS price numeric,
//     ADD COLUMN IF NOT EXISTS currency text DEFAULT 'NGN',
//     ADD COLUMN IF NOT EXISTS seats_available integer,
//     ADD COLUMN IF NOT EXISTS cabin_class text DEFAULT 'economy',
//     ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled';

const activeUser = JSON.parse(localStorage.getItem("activeUser"));

if (!activeUser || activeUser.role !== "admin") {
    window.location.href = "../admin-login.html";
}

document.getElementById("logoutBtn").onclick = () => {
    BlackcessDB.logOut();
};

const esc = BlackcessDB.escapeHtml;
let editingFlightId = null;

loadFlights();

async function loadFlights() {
    const { data, error } = await window.supabase
        .from("flights")
        .select("*")
        .order("departure_time", { ascending: true });

    if (error) {
        console.error(error);
        BlackcessUI.toast("Could not load flights: " + error.message, "error");
        return;
    }

    const table = document.getElementById("flightsTable");

    if (!data || data.length === 0) {
        table.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:30px;">No flights yet — add one above.</td></tr>`;
        return;
    }

    table.innerHTML = data.map(flight => {
        const depTime = flight.departure_time ? new Date(flight.departure_time).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "\u2014";
        const route = `${esc(flight.departure_code || flight.departure_city)} \u2192 ${esc(flight.arrival_code || flight.arrival_city)}`;
        const price = flight.price != null ? `${esc(flight.currency || "NGN")} ${Number(flight.price).toLocaleString()}` : "\u2014";

        return `
            <tr>
                <td>${esc(flight.flight_number)}</td>
                <td>${route}</td>
                <td>${depTime}</td>
                <td>${price}</td>
                <td>${flight.seats_available ?? "\u2014"}</td>
                <td>${esc(flight.status || "scheduled")}</td>
                <td>
                    <button class="action-btn edit" onclick='editFlight(${JSON.stringify(flight).replace(/'/g, "&#39;")})'>Edit</button>
                    <button class="action-btn delete" onclick="deleteFlight('${esc(flight.id)}', '${esc(flight.flight_number)}')">Delete</button>
                </td>
            </tr>
        `;
    }).join("");
}

function readForm() {
    return {
        flight_number: document.getElementById("fl-number").value.trim(),
        departure_city: document.getElementById("fl-dep-city").value.trim(),
        departure_code: document.getElementById("fl-dep-code").value.trim().toUpperCase(),
        arrival_city: document.getElementById("fl-arr-city").value.trim(),
        arrival_code: document.getElementById("fl-arr-code").value.trim().toUpperCase(),
        departure_time: document.getElementById("fl-dep-time").value,
        arrival_time: document.getElementById("fl-arr-time").value,
        price: Number(document.getElementById("fl-price").value),
        currency: document.getElementById("fl-currency").value.trim().toUpperCase() || "NGN",
        seats_available: Number(document.getElementById("fl-seats").value),
        cabin_class: document.getElementById("fl-cabin").value,
        status: document.getElementById("fl-status").value
    };
}

function resetForm() {
    document.getElementById("flight-form").reset();
    document.getElementById("fl-currency").value = "NGN";
    editingFlightId = null;
    document.getElementById("flight-form-title").textContent = "Add New Flight";
    document.getElementById("flight-submit-btn").innerHTML = '<i class="fas fa-plus"></i> Add Flight';
    document.getElementById("flight-cancel-btn").style.display = "none";
}

function editFlight(flight) {
    editingFlightId = flight.id;
    document.getElementById("fl-number").value = flight.flight_number || "";
    document.getElementById("fl-dep-city").value = flight.departure_city || "";
    document.getElementById("fl-dep-code").value = flight.departure_code || "";
    document.getElementById("fl-arr-city").value = flight.arrival_city || "";
    document.getElementById("fl-arr-code").value = flight.arrival_code || "";
    document.getElementById("fl-dep-time").value = flight.departure_time ? flight.departure_time.slice(0, 16) : "";
    document.getElementById("fl-arr-time").value = flight.arrival_time ? flight.arrival_time.slice(0, 16) : "";
    document.getElementById("fl-price").value = flight.price ?? "";
    document.getElementById("fl-currency").value = flight.currency || "NGN";
    document.getElementById("fl-seats").value = flight.seats_available ?? "";
    document.getElementById("fl-cabin").value = flight.cabin_class || "economy";
    document.getElementById("fl-status").value = flight.status || "scheduled";

    document.getElementById("flight-form-title").textContent = `Editing ${flight.flight_number}`;
    document.getElementById("flight-submit-btn").innerHTML = '<i class="fas fa-check"></i> Save Changes';
    document.getElementById("flight-cancel-btn").style.display = "inline-block";
    document.getElementById("flight-form").scrollIntoView({ behavior: "smooth" });
}

document.getElementById("flight-cancel-btn").addEventListener("click", resetForm);

document.getElementById("flight-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = readForm();

    if (!payload.flight_number || !payload.departure_code || !payload.arrival_code) {
        BlackcessUI.toast("Flight number and airport codes are required.", "error");
        return;
    }

    const submitBtn = document.getElementById("flight-submit-btn");
    submitBtn.disabled = true;

    try {
        let error;
        if (editingFlightId) {
            ({ error } = await window.supabase.from("flights").update(payload).eq("id", editingFlightId));
        } else {
            ({ error } = await window.supabase.from("flights").insert(payload));
        }

        if (error) throw error;

        BlackcessUI.toast(editingFlightId ? "Flight updated." : "Flight added.", "success");
        resetForm();
        loadFlights();
    } catch (err) {
        console.error("Flight save error:", err);
        BlackcessUI.toast("Could not save flight: " + err.message, "error");
    } finally {
        submitBtn.disabled = false;
    }
});

async function deleteFlight(id, flightNumber) {
    const ok = await BlackcessUI.confirm(
        `Delete flight ${flightNumber}?`,
        "This cannot be undone. Existing bookings referencing this flight will keep their stored details but lose the live link."
    );
    if (!ok) return;

    const { error } = await window.supabase.from("flights").delete().eq("id", id);

    if (error) {
        BlackcessUI.toast("Could not delete flight: " + error.message, "error");
        return;
    }

    BlackcessUI.toast("Flight deleted.", "success");
    loadFlights();
}
