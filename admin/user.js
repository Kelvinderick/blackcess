const activeUser = JSON.parse(localStorage.getItem("activeUser"));

if (!activeUser || activeUser.role !== "admin") {
    window.location.href = "../login.html";
}

document.getElementById("logoutBtn").onclick = () => {
    BlackcessDB.logOut();
};

loadUsers();

async function loadUsers() {

    const { data, error } = await window.supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });

    if (error) {
        console.error(error);
        alert("Could not load users: " + error.message);
        return;
    }

    const table = document.getElementById("usersTable");
    table.innerHTML = "";

    data.forEach(user => {

        const role = user.role || "user";
        const buttonLabel = role === "admin" ? "Revoke Admin" : "Make Admin";

        table.innerHTML += `

<tr>

<td>${user.full_name || "\u2014"}</td>

<td>${user.membership_id || "\u2014"}</td>

<td>${(user.miles || 0).toLocaleString()}</td>

<td>${role}</td>

<td>

<button class="action-btn edit" onclick="toggleAdmin('${user.id}', '${role}')">
${buttonLabel}
</button>

</td>

</tr>

`;
    });
}

async function toggleAdmin(id, currentRole) {

    const newRole = currentRole === "admin" ? "user" : "admin";

    // Guard against an admin accidentally locking themselves out.
    if (id === activeUser.uid && newRole !== "admin") {
        alert("You can't revoke your own admin access from here. Ask another admin to do this.");
        return;
    }

    if (!confirm(`Set this user's role to "${newRole}"?`)) return;

    const { error } = await window.supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", id);

    if (error) {
        alert(error.message);
        return;
    }

    loadUsers();
}
