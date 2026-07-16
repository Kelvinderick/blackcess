const activeUser = JSON.parse(localStorage.getItem("activeUser"));

if (!activeUser || activeUser.role !== "admin") {
    window.location.href = "../login.html";
}

document.getElementById("logoutBtn").onclick = () => {
    BlackcessDB.logOut();
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

    const table = document.getElementById("flightTable");

    table.innerHTML = "";

    data.forEach(flight => {

        table.innerHTML += `

<tr>

<td>${flight.flight_number}</td>

<td>${flight.departure_city}</td>

<td>${flight.arrival_city}</td>

<td>₦${Number(flight.price).toLocaleString()}</td>

<td>${flight.available_seats}</td>

<td>

<button class="action-btn edit">
Edit
</button>

<button
class="action-btn delete"
onclick="deleteFlight('${flight.id}')">

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
const modal = document.getElementById("flightModal");

document.getElementById("addFlightBtn").onclick = () => {
    modal.style.display = "flex";
};

document.getElementById("closeModal").onclick = () => {
    modal.style.display = "none";
};

window.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
};

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

const { error } = await window.supabase
.from("flights")
.insert([flight]);

if(error){

alert(error.message);

return;

}

modal.style.display = "none";

document.getElementById("flightForm").reset();

loadFlights();

});