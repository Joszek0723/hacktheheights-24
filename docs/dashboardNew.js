// document.addEventListener("DOMContentLoaded", async () => {
//     const titleElement = document.getElementById("welcomeMessage");

//     // Retrieve the JWT from localStorage or another method
//     const jwt = localStorage.getItem("access_token");
//     console.log(jwt)

//     if (!jwt) {
//         titleElement.textContent = "Not signed in";
//         return;
//     }

//     try {
//         // Fetch the user data from the backend
//         const response = await fetch("/verify-user", {
//             method: "GET",
//         });

//         if (!response.ok) {
//             throw new Error("Failed to verify user");
//         }

//         const data = await response.json();

//         // Check if the user object exists
//         if (data.user && data.user.role === "authenticated") {
//             titleElement.innerHTML = "Signed in";
//         } else {
//             titleElement.innerHTML = "Not signed in";
//         }
//     } catch (error) {
//         console.error("Error verifying user:", error);
//         titleElement.innerHTML = "Not signed in";
//     }
// });

// const signOut = document.getElementById("sign-out");
// signOut.addEventListener('click', async () => {
//     try {
//         const response = await fetch('/sign-out', {
//             method: 'POST',
//         });

//         if (response.ok) {
//             localStorage.removeItem("access_token");
//             window.location.href = 'landing.html';
//         } else {
//             console.error("Failed to sign out.");
//         }
//     } catch (error) {
//         console.error("Error signing out: ", error);
//     }
// })

// document.addEventListener("DOMContentLoaded", async () => {
//     const titleElement = document.getElementById("welcomeMessage");

//     // Retrieve the JWT from localStorage
//     let jwt = localStorage.getItem("access_token");
//     console.log("Initial JWT from localStorage:", jwt);

//     if (!jwt) {
//         // Extract the access_token from the URL hash
//         const hash = window.location.hash.substring(1); // Get the part after #
//         const params = new URLSearchParams(hash); // Parse it as query params
//         const tokenFromUrl = params.get("access_token");

//         if (tokenFromUrl) {
//             // Save the token to localStorage
//             localStorage.setItem("access_token", tokenFromUrl);
//             jwt = tokenFromUrl; // Set jwt to continue
//             console.log("JWT extracted from URL:", jwt);
//         }
//     }

//     if (!jwt) {
//         titleElement.textContent = "Not signed in";
//         return;
//     }

//     try {
//         // Fetch the user data from the backend
//         const response = await fetch("/verify-user", {
//             method: "GET"
//         });

//         if (!response.ok) {
//             throw new Error("Failed to verify user");
//         }

//         const data = await response.json();

//         // Check if the user object exists
//         if (data.user && data.user.role === "authenticated") {
//             titleElement.innerHTML = "Signed in";
//         } else {
//             titleElement.innerHTML = "Not signed in";
//         }
//     } catch (error) {
//         console.error("Error verifying user:", error);
//         titleElement.innerHTML = "Not signed in";
//     }
// });


document.addEventListener("DOMContentLoaded", async () => {
    const titleElement = document.getElementById("welcomeMessage");

    // Retrieve the JWT from localStorage
    let jwt = localStorage.getItem("access_token");
    console.log("Initial JWT from localStorage:", jwt);

    if (!jwt) {
        // Extract the access_token from the URL hash
        const hash = window.location.hash.substring(1); // Get the part after #
        const params = new URLSearchParams(hash); // Parse it as query params
        const tokenFromUrl = params.get("access_token");

        if (tokenFromUrl) {
            // Save the token to localStorage
            localStorage.setItem("access_token", tokenFromUrl);
            jwt = tokenFromUrl; // Set jwt to continue

            console.log("JWT extracted from URL:", jwt);
        }
    }

    if (!jwt) {
        titleElement.textContent = "Not signed in";
        return;
    }

    try {
        // Send the token to the backend for verification
        const response = await fetch("/verify-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ access_token: jwt }), // Send the token
        });

        if (!response.ok) {
            throw new Error("Failed to verify user");
        }

        const data = await response.json();

        // Check if the user object exists
        if (data.user && data.user.role === "authenticated") {
            titleElement.innerHTML = "Signed in";
        } else {
            titleElement.innerHTML = "Not signed in";
        }
    } catch (error) {
        console.error("Error verifying user:", error);
        titleElement.innerHTML = "Not signed in";
    }
});

// Sign out functionality
const signOut = document.getElementById("sign-out");
signOut.addEventListener('click', async () => {
    try {
        const response = await fetch('/sign-out', {
            method: 'POST',
        });

        if (response.ok) {
            localStorage.removeItem("access_token");
            window.location.href = 'landing.html';
        } else {
            console.error("Failed to sign out.");
        }
    } catch (error) {
        console.error("Error signing out: ", error);
    }
});
