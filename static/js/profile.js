import { retrieveJWT, signOut } from "./helperFunctions.js";

document.addEventListener("DOMContentLoaded", async () => {
    const jwt = retrieveJWT()
    try {
        const isAuthenticated = await verifyUser(jwt);
        if (isAuthenticated) {
            await handleAuthenticatedUser(jwt);
        } else {
            handleUnauthenticatedUser();
        }
    } catch (error) {
        console.error("Error verifying user:", error);
        handleUnauthenticatedUser();
    }
})

async function verifyUser(jwt) {
    const response = await fetch("/verify-user", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwt}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to verify user");
    }

    const data = await response.json();
    console.log(data)
    return data.user && data.user.role === "authenticated";
}

async function handleAuthenticatedUser(jwt) {
    console.log(jwt);
    document.querySelector('.user-icon').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.dropdown-menu').classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!document.querySelector('.user-icon').contains(e.target) && ! document.querySelector('.dropdown-menu').contains(e.target)) {
            document.querySelector('.dropdown-menu').classList.remove('show');
        }
    });

    document.getElementById("sign-out").addEventListener("click", signOut);
}

async function handleUnauthenticatedUser() {
    console.log("NOT SIGNED IN");
}