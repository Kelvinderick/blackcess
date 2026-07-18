// Blackcess Admin — Dashboard overview controller

const activeUser = JSON.parse(localStorage.getItem("activeUser"));

if (!activeUser || activeUser.role !== "admin") {
    window.location.href = "../login.html";
}

document.getElementById("logoutBtn").onclick = () => {
    BlackcessDB.logOut();
};

loadDashboard();

async function loadDashboard() {
    const [usersRes, flightsRes, bookingsRes] = await Promise.all([
        window.supabase.from("profiles").select("*").order("full_name", { ascending: true }),
        window.supabase.from("flights").select("id", { count: "exact", head: true }),
        window.supabase.from("bookings").select("id", { count: "exact", head: true })
    ]);

    if (usersRes.error) {
        console.error(usersRes.error);
        alert("Could not load users: " + usersRes.error.message);
        return;
    }

    const users = usersRes.data;
    const totalMiles = users.reduce((sum, u) => sum + (u.miles || 0), 0);

    document.getElementById("users-count").textContent = users.length;
    document.getElementById("flights-count").textContent = flightsRes.count ?? 0;
    document.getElementById("bookings-count").textContent = bookingsRes.count ?? 0;
    document.getElementById("miles-count").textContent = totalMiles.toLocaleString();

    const table = document.getElementById("usersTable");
    table.innerHTML = "";

    users.forEach(user => {
        const role = user.role || "user";
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${BlackcessDB.escapeHtml(user.full_name || "\u2014")}</td>
            <td>${BlackcessDB.escapeHtml(user.membership_id || "\u2014")}</td>
            <td>${(user.miles || 0).toLocaleString()}</td>
            <td>${BlackcessDB.escapeHtml(role)}</td>
        `;
        table.appendChild(row);
    });
}
