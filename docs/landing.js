const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});

// Sign Up Functionality

const SUPABASE_URL = 'https://buhjgxfawueqidfdpebh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1aGpneGZhd3VlcWlkZmRwZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgxNTQ0NzYsImV4cCI6MjA0MzczMDQ3Nn0.r4FQr9WCKUdgxVtwkw-FHRo2btxhwQvYCskgNgsmVZY';

const { createClient } = supabase
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
console.log('Supabase Instance: ', _supabase)

const signUpForm = document.getElementsByClassName('sign-up')[0]

signUpForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    let name = document.getElementById('nameSignUp').value;
    let email = document.getElementById('emailSignUp').value;
    let password = document.getElementById('passwordSignUp').value;

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
            name: name,
            password: password,  // It's recommended to hash the password before storing it!
            role: 'buyer'
        });

    if (dbError) {
        console.error("Error inserting into users table:", dbError.message);
        alert("Failed to create user in the database.");
    } else {
        alert("Sign-up successful! Please check your email to verify your account.");

        document.getElementById('nameSignUp').value = '';
        document.getElementById('emailSignUp').value = '';
        document.getElementById('passwordSignUp').value = '';
    }
})

// Sign In Functionality

const signInForm = document.getElementsByClassName('sign-in')[0]

signInForm.addEventListener('click', async function (event) {
    event.preventDefault();

    let email = document.getElementById('emailSignIn').value;
    let password = document.getElementById('passwordSignIn').value;

    const { user, error: authError } = await _supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (authError) {
        console.error("Error signing in: ", authError.message);
        alert("Failed to sign in. Please check your credentials and try again.");
        return;
    }

    localStorage.setItem('supabaseAccessToken', session.access_token);
    window.location.href = 'dashboardNew.html';
})