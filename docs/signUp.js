// Replace with your Supabase URL and Anon Key
const SUPABASE_URL = 'https://buhjgxfawueqidfdpebh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1aGpneGZhd3VlcWlkZmRwZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgxNTQ0NzYsImV4cCI6MjA0MzczMDQ3Nn0.r4FQr9WCKUdgxVtwkw-FHRo2btxhwQvYCskgNgsmVZY';


const { createClient } = supabase
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
console.log('Supabase Instance: ', _supabase)

// import { createClient } from '@supabase/supabase-js'

// // Create a single supabase client for interacting with your database
// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


const form = document.getElementById("registrationForm");

form.addEventListener('submit', async function (event) {
    // // Prevent the default form submission behavior
    event.preventDefault();

    // Retrieve values from the form field
    let email = document.getElementById('email').value;
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;
    let role = document.getElementById('role').value;

    // Reset the form after submission
    document.getElementById("registrationForm").reset();


    // const { error } = await _supabase
    //     .from('users')
    //     .insert({email: email, username: username, password: password, role: role})

    // Step 1: Sign up the user in Supabase authentication system
    const { user, error: authError } = await _supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            emailRedirectTo: 'https://joszek0723.github.io/hacktheheights-24/'
        }
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
            password: password,  // It's recommended to hash the password before storing it!
            role: role
        });

    if (dbError) {
        console.error("Error inserting into users table:", dbError.message);
        alert("Failed to create user in the database.");
    } else {
        alert("Sign-up successful! Please check your email to verify your account.");
    }
})