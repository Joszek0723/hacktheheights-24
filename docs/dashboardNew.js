document.addEventListener("DOMContentLoaded", async () => {
    const titleElement = document.getElementById("welcomeMessage");
    const mainContent = document.getElementById("mainContent");
    const popup = document.getElementById("popup");
    const closePopupButton = document.getElementById("close-popup");
    const createListingButton = document.getElementById("create-listing");
    const categoryDropdown = document.getElementById("category");
    const eventTicketsFields = document.getElementById("event-tickets-fields");
    const submitListingButton = document.getElementById("submit-listing");

    let jwt = retrieveJWT();
    console.log("RETRIVED JWT IS: ", jwt);

    if (!jwt) {
        titleElement.textContent = "Not signed in";
        // window.location.href = 'index.html';
        return;
    }

    try {
        const isAuthenticated = await verifyUser(jwt);
        if (isAuthenticated) {
            titleElement.innerHTML = "Signed in";

            // Add event listener for "Create a Listing"
            createListingButton.addEventListener("click", () => {
                showPopup(mainContent, popup);
            });

            // Close popup functionality
            closePopupButton.addEventListener("click", () => {
                closePopup(mainContent, popup);
            });

            // Show specific fields based on dropdown selection
            categoryDropdown.addEventListener("change", () => {
                if (categoryDropdown.value === "event-tickets") {
                    eventTicketsFields.style.display = "block";
                } else {
                    eventTicketsFields.style.display = "none";
                }
            });
        } else {
            redirectToSignIn(titleElement);
        }
    } catch (error) {
        console.error("Error verifying user:", error);
        redirectToSignIn(titleElement);
    }


     // Event listener for submit button
     submitListingButton.addEventListener("click", async () => {
        // Gather inputs
        const eventName = document.getElementById("event-name").value;
        const eventDate = document.getElementById("event-date").value;
        const numberOfTickets = document.getElementById("number-of-tickets").value;
        const price = document.getElementById("price").value;
        const venue = document.getElementById("venue").value;

        // Validate inputs
        if (!eventName || !eventDate || !numberOfTickets || !price || !venue) {
            alert("Please fill out all fields.");
            return;
        }

        // Prepare payload
        const payload = {
            title: eventName,
            event_date: eventDate,
            number_of_tickets: parseInt(numberOfTickets),
            price: parseFloat(price),
            venue: venue,
        };

        // Send POST request to FastAPI backend
        try {
            const response = await fetch("/create-event-listing", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error("Failed to create event listing");
            }

            alert("Event listing created successfully!");
            clearFields(); // Clear all input fields
        } catch (error) {
            console.error("Error creating event listing:", error);
            alert("An error occurred. Please try again.");
        }
    });

    // Function to clear all input fields
    function clearFields() {
        document.getElementById("event-name").value = "";
        document.getElementById("event-date").value = "";
        document.getElementById("number-of-tickets").value = "";
        document.getElementById("price").value = "";
        document.getElementById("venue").value = "";
    }
});

// Retrieve JWT token from localStorage or URL hash
function retrieveJWT() {
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

// Verify user authentication
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
    return data.user && data.user.role === "authenticated";
}

// Redirect to the sign-in page
function redirectToSignIn(titleElement) {
    titleElement.innerHTML = "Not signed in";
    // window.location.href = 'index.html';
}

// Show the popup and blur the background
function showPopup(mainContent, popup) {
    mainContent.classList.add("blur");
    popup.classList.add("visible");
}

// Close the popup and unblur the background
function closePopup(mainContent, popup) {
    mainContent.classList.remove("blur");
    popup.classList.remove("visible");
}

// Sign out functionality
const signOut = document.getElementById("sign-out");
signOut.addEventListener("click", async () => {
    try {
        const response = await fetch("/sign-out", {
            method: "POST",
        });

        if (response.ok) {
            localStorage.removeItem("access_token");
            window.location.href = "landing.html";
        } else {
            console.error("Failed to sign out.");
        }
    } catch (error) {
        console.error("Error signing out: ", error);
    }
});
