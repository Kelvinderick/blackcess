const activeUser = JSON.parse(localStorage.getItem("activeUser"));

if (!activeUser) {
    window.location.href = "../login.html";
}

if (activeUser.role !== "admin") {
    alert("Access Denied");
    window.location.href="../index.html";
}

document.getElementById("logoutBtn").addEventListener("click", () => {
    BlackcessDB.logOut();
});

loadDashboard();

async function loadDashboard(){

    await loadUsers();
    await loadFlights();
    await loadBookings();

}

async function loadUsers(){

    const {data,error}=await window.supabase
    .from("profiles")
    .select("*");

    if(error){
        console.error(error);
        return;
    }

    document.getElementById("users-count").textContent=data.length;

    let totalMiles=0;

    const tbody=document.getElementById("usersTable");

    tbody.innerHTML="";

    data.forEach(user=>{

        totalMiles += user.miles || 0;

        tbody.innerHTML += `
        <tr>
            <td>${user.full_name}</td>
            <td>${user.membership_id}</td>
            <td>${user.miles}</td>
            <td>${user.role}</td>
        </tr>
        `;

    });

    document.getElementById("miles-count").textContent=
    totalMiles.toLocaleString();

}

async function loadFlights(){

    const {data}=await window.supabase
    .from("flights")
    .select("*");

    document.getElementById("flights-count").textContent=
    data ? data.length : 0;

}

async function loadBookings(){

    const {data}=await window.supabase
    .from("bookings")
    .select("*");

    document.getElementById("bookings-count").textContent=
    data ? data.length : 0;

}