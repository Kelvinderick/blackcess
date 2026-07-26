const activeUser = JSON.parse(localStorage.getItem("activeUser"));

if (!activeUser || activeUser.role !== "admin") {
    window.location.href = "../admin-login.html";
}

document.getElementById("logoutBtn").onclick = () => {
    BlackcessDB.logOut();
};

loadBookings();

async function loadBookings() {

    const { data: rawBookings, error } = await window.supabase
        .from("bookings")
        .select("*, flights(flight_number, departure_city, arrival_city)")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        BlackcessUI.toast("Could not load bookings: " + error.message, "error");
        return;
    }

    // Duffel bookings have no flight_id, so the join above is null for
    // them — fall back to the flight details stored directly on the row.
    const bookings = rawBookings.map(b => ({
        ...b,
        flights: b.flights || {
            flight_number: b.flight_number,
            departure_city: b.departure_city,
            arrival_city: b.arrival_city
        }
    }));

    const table = document.getElementById("bookingsTable");
    table.innerHTML = "";

    if (bookings.length === 0) {
        table.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:30px;">No bookings yet.</td></tr>`;
        return;
    }

    const esc = BlackcessDB.escapeHtml;

    bookings.forEach(booking => {
        const flight = booking.flights;
        const route = flight
            ? `${esc(flight.flight_number)}: ${esc(flight.departure_city)} \u2192 ${esc(flight.arrival_city)}`
            : "\u2014";

        table.innerHTML += `

<tr>

<td>${esc(booking.pnr) || "\u2014"}</td>

<td>${esc(booking.passenger_lastname) || "\u2014"}</td>

<td>${esc(booking.passenger_email) || "\u2014"}</td>

<td>${route}</td>

<td>${esc(booking.status) || "\u2014"}</td>

<td>

<button class="action-btn edit" onclick="checkInBooking('${esc(booking.id)}')">
Check-In
</button>

<button class="action-btn delete" onclick="deleteBooking('${esc(booking.id)}')">
Delete
</button>

</td>

</tr>

`;
    });
}

async function checkInBooking(id) {

    const { error } = await window.supabase
        .from("bookings")
        .update({ status: "Checked-In" })
        .eq("id", id);

    if (error) {
        BlackcessUI.toast(error.message, "error");
        return;
    }

    BlackcessUI.toast("Passenger checked in.", "success");
    loadBookings();
}

async function deleteBooking(id) {

    const ok = await BlackcessUI.confirm("Delete this booking?", "This cannot be undone.");
    if (!ok) return;

    const { error } = await window.supabase
        .from("bookings")
        .delete()
        .eq("id", id);

    if (error) {
        BlackcessUI.toast(error.message, "error");
        return;
    }

    BlackcessUI.toast("Booking deleted.", "success");
    loadBookings();
}
