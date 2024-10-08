// Replace with your Supabase URL and Anon Key
const SUPABASE_URL = 'https://buhjgxfawueqidfdpebh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1aGpneGZhd3VlcWlkZmRwZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgxNTQ0NzYsImV4cCI6MjA0MzczMDQ3Nn0.r4FQr9WCKUdgxVtwkw-FHRo2btxhwQvYCskgNgsmVZY';

const { createClient } = supabase
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Wait for DOM to be fully loaded before executing scripts
document.addEventListener("DOMContentLoaded", () => {

    // Check which page is being loaded by checking the body element's ID
    if (document.body.id === 'dashboardPage') {
        handleDashboard();
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
                // authLink.href = '#'; // Placeholder for sign-out logic

                // Fetch user role from the custom 'users' table
                fetchUserRole(user.email);

                // Add sign-out logic
                authLink.addEventListener('click', async (event) => {
                    event.preventDefault(); // Prevent default link behavior
                    
                    const { error } = await _supabase.auth.signOut();
                    
                    if (error) {
                        console.error('Error signing out:', error.message);
                        alert('Failed to sign out. Please try again.');
                    } else {
                        alert('You have successfully signed out!');
                        // Redirect to login or home page after sign-out
                        window.location.href = 'index.html';
                    }
                });
            } else {
                // User is not logged in
                authLink.textContent = 'Log in/Register';
                authLink.href = 'logIn.html'; // Redirect to registration form

                // Display content for non-logged-in users
                dashboardContent.innerHTML = `
                    <h2>Welcome to BABPT!</h2>
                    <p>Find or offer registration spots for your courses in real-time.</p>
                    <button id="createAccountBtn">Make an account</button>
                `;
                document.getElementById('createAccountBtn').addEventListener('click', () => {
                    window.location.href = 'signUp.html'; // Redirect to registration form
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
