// Blackcess Airlines Authentication and Database Helper (Supabase Integration)

const BlackcessDB = {
    // Generate a random membership ID: BC followed by 6 digits
    generateMembershipId() {
        return "BC" + Math.floor(100000 + Math.random() * 900000);
    },

    // Escape user-supplied text before it goes into innerHTML anywhere.
    // Booking/profile fields (names, PNRs, etc.) come from user input and
    // are rendered in admin tables and dashboards, so they must never be
    // inserted raw or a passenger could stash a script tag in their name.
    escapeHtml(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    },

    // Sign Up a new passenger and create their Royal Club profile
    async signUp(name, email, password, passport) {
        // Profile creation now happens server-side via a database trigger
        // (on_auth_user_created -> handle_new_user) that fires the moment
        // the auth.users row is created — that runs with elevated
        // privileges, so it works whether or not "Confirm email" is turned
        // on. We just pass the profile details as signup metadata for the
        // trigger to read; we don't insert into `profiles` from the client
        // at all anymore, since a client-side insert immediately after
        // signUp() can run before there's an active session (if email
        // confirmation is required), which RLS correctly rejects.
        const membershipId = this.generateMembershipId();

        const { data: authData, error: authError } = await window.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                    passport_number: passport,
                    membership_id: membershipId
                }
            }
        });

        if (authError) {
            console.error("Sign up auth error:", authError);
            throw new Error(authError.message);
        }

        const user = authData.user;
        if (!user) throw new Error("Failed to retrieve user registry context.");

        // If there's no session yet, "Confirm email" is turned on for this
        // project — the user has to click the link in their inbox before
        // they can actually log in. The profile row will already exist
        // (the trigger fired when auth.users got the row), but there's
        // nothing to log them into yet.
        if (!authData.session) {
            return {
                pendingConfirmation: true,
                email: email,
                membership_id: membershipId
            };
        }

        const profile = {
            uid: user.id,
            email: email,
            name: name,
            passport: passport,
            membership_id: membershipId,
            miles: 500,
            role: "user"
        };

        // Cache user details locally
        localStorage.setItem("activeUser", JSON.stringify(profile));
        return profile;
    },

    // Log In existing passenger
    async logIn(email, password) {
        // 1. Sign in via Supabase Auth
        const { data: authData, error: authError } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (authError) {
            console.error("Login auth error:", authError);
            throw new Error(authError.message);
        }

        const user = authData.user;
        if (!user) throw new Error("Passenger credentials not found.");

        // 2. Fetch profile from database
        const { data: profileData, error: profileError } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error("Fetch profile database error:", profileError);
            throw new Error("Authenticated, but could not load profile details: " + profileError.message);
        }

     const profile = {
    uid: user.id,
    email: user.email,
    name: profileData.full_name,
    passport: profileData.passport_number,
    membership_id: profileData.membership_id,
    miles: profileData.miles,
    role: profileData.role
};

        // Cache user details locally
        localStorage.setItem("activeUser", JSON.stringify(profile));
        return profile;
    },

    // Log Out passenger
    async logOut() {
        const { error } = await window.supabase.auth.signOut();
        if (error) {
            console.error("Sign out error:", error);
        }
        localStorage.removeItem("activeUser");
        window.location.href = "index.html";
    },

    // Retrieve bookings: either by user UID or by PNR & Lastname (for guest retrieval)
    async getBookings({ uid, pnr, lastname }) {
        if (uid) {
            // Embed the related flight row (requires the bookings.flight_id ->
            // flights.id foreign key from the migration) so callers get real
            // flight fields under booking.flights instead of having to do a
            // second manual lookup.
            const { data, error } = await window.supabase
                .from('bookings')
                .select('*, flights(flight_number, departure_city, arrival_city, departure_time, arrival_time)')
                .eq('user_id', uid)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Retrieve bookings error:", error);
                throw new Error(error.message);
            }

            // Bookings made through Duffel have no flight_id (that table is
            // no longer the source of flight data), so the join above comes
            // back null for them — fall back to the flight details stored
            // directly on the booking row instead.
            return data.map(b => ({
                ...b,
                flights: b.flights || {
                    flight_number: b.flight_number,
                    departure_city: b.departure_city,
                    arrival_city: b.arrival_city,
                    departure_time: b.departure_time,
                    arrival_time: b.arrival_time
                }
            }));
        }

        if (pnr && lastname) {
            // Guests aren't logged in, so RLS blocks a direct table read here
            // on purpose. This goes through a security-definer function that
            // only ever returns the one booking matching this exact PNR +
            // last name pair, instead of exposing the whole bookings table.
            const { data, error } = await window.supabase
                .rpc('lookup_booking', { p_pnr: pnr.trim(), p_lastname: lastname.trim() });

            if (error) {
                console.error("Retrieve bookings error:", error);
                throw new Error(error.message);
            }

            return data;
        }

        throw new Error("Missing parameters for query filter.");
    },

    // Check-in passenger by updating booking status and awarding miles.
    // This runs entirely inside the checkin_booking() Postgres function
    // (SECURITY DEFINER) so it works under RLS even for guests who have no
    // direct write access to bookings/profiles — the old version updated
    // both tables straight from the client, which RLS now blocks.
    async checkInBooking(pnr, lastname) {
        const { data, error } = await window.supabase
            .rpc('checkin_booking', { p_pnr: pnr.trim(), p_lastname: lastname.trim() })
            .single();

        if (error) {
            console.error("Check-in error:", error);
            throw new Error(error.message);
        }

        // Keep the local cache in sync if the checked-in passenger is the
        // currently logged-in user.
        if (data.user_id) {
            const cachedUser = JSON.parse(localStorage.getItem("activeUser") || "null");
            if (cachedUser && cachedUser.uid === data.user_id) {
                cachedUser.miles = (cachedUser.miles || 0) + 500;
                localStorage.setItem("activeUser", JSON.stringify(cachedUser));
                window.dispatchEvent(new Event("authChange"));
            }
        }

        return data;
    }
};

// Auto-run: Initialize navbar status based on current session
function updateNavbarUI() {
    const navMenu = document.getElementById("navMenu");
    if (!navMenu) return;

    // Remove any existing user menu or login buttons to prevent duplication
    const oldUserMenu = navMenu.querySelector(".user-menu");
    if (oldUserMenu) oldUserMenu.remove();
    const oldLoginBtn = navMenu.querySelector(".login-nav-item");
    if (oldLoginBtn) oldLoginBtn.remove();

    const activeUser = JSON.parse(localStorage.getItem("activeUser") || "null");

    if (activeUser) {
        // Logged In: link straight to the real dashboard, with a small dropdown
        const userLi = document.createElement("li");
        userLi.className = "nav-item dropdown user-menu";
        userLi.innerHTML = `
            <a href="dashboard.html" class="nav-link"><i class="fas fa-user-circle" style="margin-right:5px;"></i> ${(activeUser.name || 'Account').split(' ')[0].toUpperCase()} <i class="fas fa-chevron-down"></i></a>
            <div class="dropdown-menu">
                <a href="dashboard.html" class="dropdown-item"><i class="fas fa-gauge"></i> Dashboard</a>
                <a href="my-bookings.html" class="dropdown-item"><i class="fas fa-ticket"></i> My Bookings</a>
                <a href="online_check.html" class="dropdown-item"><i class="fas fa-clipboard-check"></i> Check-In</a>
                <a href="#" id="navbar-logout-btn" class="dropdown-item"><i class="fas fa-sign-out-alt"></i> Log Out</a>
            </div>
        `;
        navMenu.appendChild(userLi);

        // Add dropdown interaction click handlers for responsive layout compatibility
        const dropdownLink = userLi.querySelector(".nav-link");
        dropdownLink.addEventListener("click", function(e) {
            if(window.innerWidth <= 768){
                e.preventDefault();
                userLi.classList.toggle("open");
            }
        });

        // Add logout listener
        userLi.querySelector("#navbar-logout-btn").addEventListener("click", function(e) {
            e.preventDefault();
            BlackcessDB.logOut();
        });
    } else {
        // Logged Out: Create Sign In nav item
        const loginLi = document.createElement("li");
        loginLi.className = "nav-item login-nav-item";
        loginLi.innerHTML = `
            <a href="login.html" class="nav-link" style="color:var(--gold); font-weight:700;"><i class="fas fa-sign-in-alt"></i> SIGN IN</a>
        `;
        navMenu.appendChild(loginLi);
    }
}

// Attach event listeners
document.addEventListener("DOMContentLoaded", () => {
    updateNavbarUI();
    window.addEventListener("authChange", updateNavbarUI);
});

// Update auth indicators in header if auth state shifts inside Supabase auth listener
if (window.supabase) {
    window.supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session) {
            // Check if profile details already cached
            const cachedUser = JSON.parse(localStorage.getItem("activeUser") || "null");
            if (!cachedUser || cachedUser.uid !== session.user.id) {
                // Retrieve profile details to build cache
                try {
                    const { data: profileData } = await window.supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();
                        
                    if (profileData) {
                        const profile = {
                            uid: session.user.id,
                            email: session.user.email,
                            name: profileData.full_name,
                            passport: profileData.passport_number,
                            membership_id: profileData.membership_id,
                            miles: profileData.miles,
                            role: profileData.role
                        };
                        localStorage.setItem("activeUser", JSON.stringify(profile));
                        window.dispatchEvent(new Event("authChange"));
                    }
                } catch(e) {
                    console.error("Error building session profile cache:", e);
                }
            }
        } else if (event === "SIGNED_OUT") {
            localStorage.removeItem("activeUser");
            window.dispatchEvent(new Event("authChange"));
        }
    });
}
