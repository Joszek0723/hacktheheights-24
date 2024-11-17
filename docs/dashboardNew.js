import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://buhjgxfawueqidfdpebh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1aGpneGZhd3VlcWlkZmRwZWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgxNTQ0NzYsImV4cCI6MjA0MzczMDQ3Nn0.r4FQr9WCKUdgxVtwkw-FHRo2btxhwQvYCskgNgsmVZY';
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchUserInfo(email) {
    const { data, error } = await _supabase
        .from('users')
        .select('name')
        .eq('email', email)
        .single()
    
    if (error || !data) {
        console.error("Error fetching user information: ", error);
        return;
    }

    return data.name;
}

document.addEventListener('DOMContentLoaded', async () => {
    const storedSession = JSON.parse(localStorage.getItem('supabaseSession'));

    if (!storedSession || !storedSession.access_token) {
        window.location.href = 'index.html';
        return;
    }

    const { data: {user} , error } = await _supabase.auth.getUser(storedSession.access_token);

    if (error || !user) {
        console.error('Error fetching user:', error);
        window.location.href = 'index.html';
        return;
    }

    console.log(user.email);

    document.getElementById('welcomeMessage').innerText = `Hello, ${await fetchUserInfo(user.email)}`;
});

// const API_BASE_URL = 'http://127.0.0.1:8000';

// document.addEventListener('DOMContentLoaded', async () => {
//     const storedSession = JSON.parse(localStorage.getItem('supabaseSession'));

//     if (!storedSession || !storedSession.access_token) {
//         window.location.href = 'index.html';
//         return;
//     }

//     const token = storedSession.access_token;

//     try {
//         const sessionResponse = await fetch(`${API_BASE_URL}/auth/session`, {
//             method: 'GET',
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//             },
//         });

//         if (!sessionResponse.ok) {
//             throw new Error('Session validation failed');
//         }

//         const { user } = await sessionResponse.json();

//         const userInfoResponse = await fetch(`/user/info?email=${encodeURIComponent(user.email)}`, {
//             method: 'GET',
//         });

//         if (!userInfoResponse.ok) {
//             throw new Error('Failed to fetch user info');
//         }

//         const { name } = await userInfoResponse.json();

//         document.getElementById('welcomeMessage').innerText = `Hello, ${name}`;
//     } catch (error) {
//         console.error(error);
//         // window.location.href = 'index.html';
//     }
// });

// const API_BASE_URL = 'http://127.0.0.1:8000';

// fetch(`${API_BASE_URL}/test`)
//     .then((response) => {
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
//         return response.json();
//     })
//     .then((data) => {
//         console.log("Response from root endpoint:", data);
//     })
//     .catch((error) => {
//         console.error("Error while fetching root endpoint:", error);
//     });