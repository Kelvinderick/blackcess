const activeUser = JSON.parse(localStorage.getItem("activeUser"));

if (!activeUser || activeUser.role !== "admin") {
    window.location.href = "../admin-login.html";
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
        BlackcessUI.toast("Could not load users: " + error.message, "error");
        return;
    }

    const table = document.getElementById("usersTable");
    table.innerHTML = "";

    data.forEach(user => {

        const role = user.role || "user";
        const buttonLabel = role === "admin" ? "Revoke Admin" : "Make Admin";

        const esc = BlackcessDB.escapeHtml;

        table.innerHTML += `

<tr>

<td>${esc(user.full_name) || "\u2014"}</td>

<td>${esc(user.membership_id) || "\u2014"}</td>

<td>${(user.miles || 0).toLocaleString()}</td>

<td>${esc(role)}</td>

<td>

<button class="action-btn edit" onclick="toggleAdmin('${esc(user.id)}', '${esc(role)}')">
${esc(buttonLabel)}
</button>

<button class="action-btn delete" onclick="deleteUser('${esc(user.id)}', '${esc(user.full_name)}', '${esc(user.email || '')}')">
Delete
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
        BlackcessUI.toast("You can't revoke your own admin access from here. Ask another admin to do this.", "error");
        return;
    }

    const ok = await BlackcessUI.confirm(`Set this user's role to "${newRole}"?`);
    if (!ok) return;

    const { error } = await window.supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", id);

    if (error) {
        BlackcessUI.toast(error.message, "error");
        return;
    }

    BlackcessUI.toast("Role updated.", "success");
    loadUsers();
}

async function deleteUser(id, fullName, email) {
    if (id === activeUser.uid) {
        BlackcessUI.toast("You cannot delete your own admin account from here.", "error");
        return;
    }

    const ok = await BlackcessUI.confirm(`Delete ${fullName || 'this user'} permanently?`, "This action cannot be undone.");
    if (!ok) {
        return;
    }

    const userEmail = email || null;

    const { error: deleteBookingsError } = await window.supabase
        .from("bookings")
        .delete()
        .eq("user_id", id);

    if (deleteBookingsError) {
        console.warn("Could not delete bookings by user_id before deleting profile:", deleteBookingsError.message);
    }

    if (userEmail) {
        const { error: deleteBookingsByEmailError } = await window.supabase
            .from("bookings")
            .delete()
            .eq("passenger_email", userEmail);

        if (deleteBookingsByEmailError) {
            console.warn("Could not delete bookings by email before deleting profile:", deleteBookingsByEmailError.message);
        }
    }

    const { error } = await window.supabase
        .from("profiles")
        .delete()
        .eq("id", id);

    if (error) {
        BlackcessUI.toast(error.message, "error");
        return;
    }

    await BlackcessDB.deleteAuthUser(id);

    BlackcessUI.toast("User deleted.", "success");
    loadUsers();
}
