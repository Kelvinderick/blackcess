document.addEventListener("DOMContentLoaded", () => {
    const activeUser = JSON.parse(localStorage.getItem("activeUser") || "null");
    if (activeUser && activeUser.role === "admin") {
        window.location.href = "admin/admin.html";
        return;
    }

    const form = document.getElementById("adminLoginForm");
    const submitBtn = document.getElementById("admin-login-btn");
    const errorDiv = document.getElementById("admin-login-error");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        errorDiv.classList.remove("visible");
        submitBtn.classList.add("loading");
        submitBtn.disabled = true;
        submitBtn.querySelector(".btn-text").innerText = "Signing in...";

        const email = document.getElementById("admin-email").value.trim();
        const password = document.getElementById("admin-password").value;

        try {
            await BlackcessDB.logInAsAdmin(email, password);
            submitBtn.querySelector(".btn-text").innerText = "Redirecting...";
            window.location.href = "admin/admin.html";
        } catch (error) {
            errorDiv.innerText = error.message || "Unable to sign in.";
            errorDiv.classList.add("visible");
            submitBtn.classList.remove("loading");
            submitBtn.disabled = false;
            submitBtn.querySelector(".btn-text").innerText = "Sign in";
        }
    });
});
