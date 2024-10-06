// Replace with your Supabase URL and Anon Key
const SUPABASE_URL = 'https://buhjgxfawueqidfdpebh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1aGpneGZhd3VlcWlkZmRwZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgxNTQ0NzYsImV4cCI6MjA0MzczMDQ3Nn0.r4FQr9WCKUdgxVtwkw-FHRo2btxhwQvYCskgNgsmVZY';

const { createClient } = supabase
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Wait for DOM to be fully loaded before executing scripts
document.addEventListener("DOMContentLoaded", () => {

    // Check which page is being loaded by checking the body element's ID
    if (document.body.id === 'registrationPage') {
        handleRegistration();
    } else if (document.body.id === 'dashboardPage') {
        handleDashboard();
    }

    // Function to handle registration logic on index.html
    function handleRegistration() {
        const form = document.getElementById("registrationForm");

        form.addEventListener('submit', async function (event) {
            // Prevent the default form submission behavior
            event.preventDefault();

            // Retrieve values from the form field
            let email = document.getElementById('email').value;
            let username = document.getElementById('username').value;
            let password = document.getElementById('password').value;
            let role = document.getElementById('role').value;

            // Reset the form after submission
            document.getElementById("registrationForm").reset();

            // Step 1: Sign up the user in Supabase authentication system
            const { user, error: authError } = await _supabase.auth.signUp({
                email: email,
                password: password
            });

            if (authError) {
                console.error("Error signing up:", authError.message);
                alert("Failed to sign up. Please try again.");
                return;
            }

            // Step 2: If the auth signup was successful, insert the user into the custom 'users' table
            const { error: dbError } = await _supabase
                .from('users')
                .insert({
                    email: email,
                    username: username,
                    password: password, // It's recommended to hash the password before storing it!
                    role: role
                });

            if (dbError) {
                console.error("Error inserting into users table:", dbError.message);
                alert("Failed to create user in the database.");
            } else {
                alert("Sign-up successful! Please check your email to verify your account.");
            }
        });
    }

    // Function to handle dashboard logic on dashboard.html
    function handleDashboard() {
        const authLink = document.getElementById('authLink');
        const dashboardContent = document.getElementById('dashboardContent');

        // Check if user is logged in
        _supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                // User is logged in
                authLink.textContent = 'Sign out';
                authLink.href = '#'; // Placeholder for sign-out logic

                // Fetch user role from the custom 'users' table
                fetchUserRole(user.email);
            } else {
                // User is not logged in
                authLink.textContent = 'Log in/Register';
                authLink.href = 'index.html'; // Redirect to registration form

                // Display content for non-logged-in users
                dashboardContent.innerHTML = `
                    <h2>Welcome to BABPT!</h2>
                    <p>Find or offer registration spots for your courses in real-time.</p>
                    <button id="createAccountBtn">Make an account</button>
                `;
                document.getElementById('createAccountBtn').addEventListener('click', () => {
                    window.location.href = 'index.html'; // Redirect to registration form
                });
            }
        });
    }

    // Helper function to fetch user role from 'users' table and show appropriate content
    async function fetchUserRole(email) {
        const { data, error } = await _supabase
            .from('users')
            .select('role')
            .eq('email', email)
            .single();

        if (error || !data) {
            console.error("Error fetching user role:", error);
            alert("Failed to fetch user role. Please try again.");
            return;
        }

        const role = data.role;
        const dashboardContent = document.getElementById('dashboardContent');

        if (role === 'seller') {
            dashboardContent.innerHTML = `
                <button id="postOfferingBtn">Post an offering</button>
                <form id="sellerForm" style="display: none;">
                    <!-- Seller fields go here -->
                    <input type="text" placeholder="School" id="school" required>
                    <input type="text" placeholder="Majors" id="majors" required>
                    <input type="text" placeholder="Minors" id="minors">
                    <input type="number" placeholder="Available Credits" id="available_credits" required>
                    <input type="text" placeholder="Time Conflicts" id="time_conflicts" required>
                    <input type="text" placeholder="Class Year" id="class_year" required>
                    <input type="datetime-local" placeholder="Pick Time" id="pick_time" required>
                    <button type="submit">Submit</button>
                </form>
            `;
            document.getElementById('postOfferingBtn').addEventListener('click', () => {
                document.getElementById('sellerForm').style.display = 'block';
            });
        } else if (role === 'buyer') {
            dashboardContent.innerHTML = `
                <button id="postRequestBtn">Post a request</button>
                <form id="buyerForm" style="display: none;">
                    <!-- Buyer fields go here -->
                    <input type="text" placeholder="Course Code" id="course_code" required>
                    <input type="text" placeholder="Course Title" id="title" required>
                    <input type="text" placeholder="Section" id="section" required>
                    <input type="text" placeholder="Time Slot" id="time_slot" required>
                    <input type="number" placeholder="Credits" id="credits" required>
                    <input type="text" placeholder="Restrictions" id="restrictions" required>
                    <input type="text" placeholder="Class Year Restrictions" id="class_year_restrictions" required>
                    <button type="submit">Submit</button>
                </form>
            `;
            document.getElementById('postRequestBtn').addEventListener('click', () => {
                document.getElementById('buyerForm').style.display = 'block';
            });
        }
    }
});
