const activeUser = JSON.parse(localStorage.getItem("activeUser"));

if (!activeUser || activeUser.role !== "admin") {
    window.location.href = "../login.html";
}

document.getElementById("logoutBtn").onclick = () => {
    BlackcessDB.logOut();
};

loadBookings();

async function loadBookings() {

    const { data: bookings, error } = await window.supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        alert("Could not load bookings: " + error.message);
        return;
    }

    // Resolve the flight for each booking in one batch query, rather than
    // one request per row.
    const flightIds = [...new Set(bookings.map(b => b.flight_id).filter(Boolean))];
    let flightsById = {};

    if (flightIds.length > 0) {
        const { data: flights, error: flightsError } = await window.supabase
            .from("flights")
            .select("*")
            .in("id", flightIds);

        if (flightsError) {
            console.error(flightsError);
        } else {
            flightsById = Object.fromEntries(flights.map(f => [f.id, f]));
        }
    }

    const table = document.getElementById("bookingsTable");
    table.innerHTML = "";

    if (bookings.length === 0) {
        table.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:30px;">No bookings yet.</td></tr>`;
        return;
    }

    bookings.forEach(booking => {
        const flight = flightsById[booking.flight_id];
        const route = flight
            ? `${flight.flight_number}: ${flight.departure_city} \u2192 ${flight.arrival_city}`
            : "\u2014";

        table.innerHTML += `

<tr>

<td>${booking.pnr || "\u2014"}</td>

<td>${booking.passenger_lastname || "\u2014"}</td>

<td>${booking.passenger_email || "\u2014"}</td>

<td>${route}</td>

<td>${booking.status || "\u2014"}</td>

<td>

<button class="action-btn edit" onclick="checkInBooking('${booking.id}')">
Check-In
</button>

<button class="action-btn delete" onclick="deleteBooking('${booking.id}')">
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
        alert(error.message);
        return;
    }

    loadBookings();
}

async function deleteBooking(id) {

    if (!confirm("Delete this booking?")) return;

    const { error } = await window.supabase
        .from("bookings")
        .delete()
        .eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    loadBookings();
}
