// Blackcess Airlines Authentication and Database Helper (Supabase Integration)

const BlackcessDB = {
    // Generate a random membership ID: BC followed by 6 digits
    generateMembershipId() {
        return "BC" + Math.floor(100000 + Math.random() * 900000);
    },

    // Sign Up a new passenger and create their Royal Club profile
    async signUp(name, email, password, passport) {
        // 1. Sign up user in Supabase Auth
        const { data: authData, error: authError } = await window.supabase.auth.signUp({
            email: email,
            password: password
        });

        if (authError) {
            console.error("Sign up auth error:", authError);
            throw new Error(authError.message);
        }

        const user = authData.user;
        if (!user) throw new Error("Failed to retrieve user registry context.");

        // 2. Generate Membership ID
        const membershipId = this.generateMembershipId();

        // 3. Create profile entry in 'profiles' table
        const { error: profileError } = await window.supabase
            .from('profiles')
            .insert([
                {
                    id: user.id,
                    full_name: name,
                    passport_number: passport,
                    membership_id: membershipId,
                    miles: 500 // Award 500 welcome miles
                }
            ]);

        if (profileError) {
            console.error("Profile creation error:", profileError);
            throw new Error("Auth registered, but profile database entry failed: " + profileError.message);
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
            const { data, error } = await window.supabase
                .from('bookings')
                .select('*')
                .eq('user_id', uid)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Retrieve bookings error:", error);
                throw new Error(error.message);
            }

            return data;
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

    // Check-in passenger by updating booking status and awarding miles
    async checkInBooking(pnr, lastname) {
        // 1. Fetch booking to verify existence and check-in eligibility
        const bookings = await this.getBookings({ pnr, lastname });
        if (bookings.length === 0) {
            throw new Error("No booking found matching reference code and passenger last name.");
        }

        const booking = bookings[0];
        if (booking.status === 'Checked-In') {
            throw new Error("Passenger has already checked in online for this flight.");
        }

        // 2. Perform check-in update
        const { data, error } = await window.supabase
            .from('bookings')
            .update({ status: 'Checked-In' })
            .eq('id', booking.id)
            .select();

        if (error) {
            console.error("Check-in database update error:", error);
            throw new Error("Failed to register check-in status: " + error.message);
        }

        // 3. Award miles if booking is associated with a registered member profile
        if (booking.user_id) {
            const milesEarned = 500; // Award 500 miles for checking in
            const { data: profileData } = await window.supabase
                .from('profiles')
                .select('miles')
                .eq('id', booking.user_id)
                .single();
                
            if (profileData) {
                const updatedMiles = (profileData.miles || 0) + milesEarned;
                await window.supabase
                    .from('profiles')
                    .update({ miles: updatedMiles })
                    .eq('id', booking.user_id);
                
                // Update local storage activeUser cache if user is logged in
                const cachedUser = JSON.parse(localStorage.getItem("activeUser") || "null");
                if (cachedUser && cachedUser.uid === booking.user_id) {
                    cachedUser.miles = updatedMiles;
                    localStorage.setItem("activeUser", JSON.stringify(cachedUser));
                    
                    // Dispatch auth event to trigger navbar update
                    window.dispatchEvent(new Event("authChange"));
                }
            }
        }

        return data[0];
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
                <a href="book.html" class="dropdown-item"><i class="fas fa-plane"></i> Book a Flight</a>
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
                            miles: profileData.miles
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
