
             const activeUser = JSON.parse(localStorage.getItem("activeUser"));

if (!activeUser || activeUser.role !== "admin") {
    window.location.href = "../login.html";
}

document.getElementById("logoutBtn").onclick = () => {
    BlackcessDB.logOut();
};

const modal = document.getElementById("flightModal");
const modalTitle = modal.querySelector("h2");
const submitBtn = document.getElementById("flightForm").querySelector("button[type=submit]");

// Tracks which flight is being edited, if any. null means "Add Flight" mode.
let editingFlightId = null;
let flightsById = {};

function openAddModal() {
    editingFlightId = null;
    document.getElementById("flightForm").reset();
    modalTitle.textContent = "Add Flight";
    submitBtn.textContent = "Save Flight";
    modal.style.display = "flex";
}

function openEditModal(id) {
    const flight = flightsById[id];
    if (!flight) return;

    editingFlightId = id;
    document.getElementById("flightNumber").value = flight.flight_number || "";
    document.getElementById("departureCity").value = flight.departure_city || "";
    document.getElementById("arrivalCity").value = flight.arrival_city || "";
    // datetime-local inputs need "YYYY-MM-DDTHH:mm" with no timezone suffix
    document.getElementById("departureTime").value = (flight.departure_time || "").slice(0, 16);
    document.getElementById("arrivalTime").value = (flight.arrival_time || "").slice(0, 16);
    document.getElementById("price").value = flight.price;
    document.getElementById("seats").value = flight.available_seats;

    modalTitle.textContent = "Edit Flight";
    submitBtn.textContent = "Update Flight";
    modal.style.display = "flex";
}

document.getElementById("addFlightBtn").onclick = openAddModal;

document.getElementById("closeModal").onclick = () => {
    modal.style.display = "none";
};

window.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
};

loadFlights();

async function loadFlights() {

    const { data, error } = await window.supabase
        .from("flights")
        .select("*")
        .order("departure_time", { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    flightsById = Object.fromEntries(data.map(f => [f.id, f]));

    const esc = BlackcessDB.escapeHtml;
    const table = document.getElementById("flightTable");

    table.innerHTML = "";

    data.forEach(flight => {

        table.innerHTML += `

<tr>

<td>${esc(flight.flight_number)}</td>

<td>${esc(flight.departure_city)}</td>

<td>${esc(flight.arrival_city)}</td>

<td>₦${Number(flight.price).toLocaleString()}</td>

<td>${flight.available_seats}</td>

<td>

<button class="action-btn edit" onclick="openEditModal('${esc(flight.id)}')">
Edit
</button>

<button
class="action-btn delete"
onclick="deleteFlight('${esc(flight.id)}')">

Delete

</button>

</td>

</tr>

`;

    });

}

async function deleteFlight(id){

if(!confirm("Delete this flight?")) return;

const {error}=await window.supabase

.from("flights")

.delete()

.eq("id",id);

if(error){

alert(error.message);

return;

}

loadFlights();

}

document
.getElementById("flightForm")
.addEventListener("submit", async (e) => {

e.preventDefault();

const flight = {

flight_number:
document.getElementById("flightNumber").value,

departure_city:
document.getElementById("departureCity").value,

arrival_city:
document.getElementById("arrivalCity").value,

departure_time:
document.getElementById("departureTime").value,

arrival_time:
document.getElementById("arrivalTime").value,

price:
Number(document.getElementById("price").value),

available_seats:
Number(document.getElementById("seats").value)

};

const { error } = editingFlightId
? await window.supabase.from("flights").update(flight).eq("id", editingFlightId)
: await window.supabase.from("flights").insert([flight]);

if(error){

alert(error.message);

return;

}

modal.style.display = "none";

editingFlightId = null;

document.getElementById("flightForm").reset();

loadFlights();

});
 