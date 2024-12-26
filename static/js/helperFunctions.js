/**
 * Retrieves the JWT token from localStorage or URL hash.
 * @returns {string | null} JWT token if available, otherwise null.
 */
export function retrieveJWT() {
    let jwt = localStorage.getItem("access_token");
    if (!jwt) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const tokenFromUrl = params.get("access_token");
        if (tokenFromUrl) {
            localStorage.setItem("access_token", tokenFromUrl);
            jwt = tokenFromUrl;
        }
    }
    return jwt;
}


/**
 * Signs out the user and redirects to the landing page.
 */
export async function signOut() {
    try {
        const response = await fetch("/sign-out", {
            method: "POST",
        });

        if (response.ok) {
            localStorage.removeItem("access_token");
            window.location.href = "/";
        } else {
            console.error("Failed to sign out.");
        }
    } catch (error) {
        console.error("Error signing out:", error);
    }
}