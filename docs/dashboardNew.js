// const SUPABASE_URL = 'https://buhjgxfawueqidfdpebh.supabase.co';
// const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1aGpneGZhd3VlcWlkZmRwZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgxNTQ0NzYsImV4cCI6MjA0MzczMDQ3Nn0.r4FQr9WCKUdgxVtwkw-FHRo2btxhwQvYCskgNgsmVZY';

// const { createClient } = supabase
// const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
// console.log('Supabase Instance: ', _supabase)

// document.addEventListener('DOMContentLoaded', async () => {
//     const token = localStorage.getItem('supabaseAccessToken');

//     if (!token) {
//         window.location.href = 'dashboard.html';
//         return;
//     }

//     const { data: user, error } = await _supabase.auth.getUser(token);

//     if (error || !user) {
//         console.error("Error fetching user: ", error);
//         window.location.href = 'dashboard.html';
//         return;
//     }

//     document.getElementById('welcome-message').innerText = `Hello, {user.user_metadata.name}`;
// })

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://buhjgxfawueqidfdpebh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1aGpneGZhd3VlcWlkZmRwZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgxNTQ0NzYsImV4cCI6MjA0MzczMDQ3Nn0.r4FQr9WCKUdgxVtwkw-FHRo2btxhwQvYCskgNgsmVZY';
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    const storedSession = JSON.parse(localStorage.getItem('supabaseSession'));

    if (!storedSession || !storedSession.access_token) {
        // Redirect to login page if no valid session is found
        window.location.href = 'index.html';
        return;
    }

    // Fetch the user details using the stored access token
    const { data: { user }, error } = await _supabase.auth.getUser(storedSession.access_token);

    if (error || !user) {
        console.error('Error fetching user:', error);
        window.location.href = 'index.html';
        return;
    }

    // Display a personalized message
    document.getElementById('welcomeMessage').innerText = `Hello, ${user.user_metadata.name}`;
});
