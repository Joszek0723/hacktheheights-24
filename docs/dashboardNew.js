document.addEventListener("DOMContentLoaded", async () => {
    const elements = {
        titleElement: document.getElementById("welcomeMessage"),
        mainContent: document.getElementById("mainContent"),
        popup: document.getElementById("popup"),
        closePopupButton: document.getElementById("close-popup"),
        createListingButton: document.getElementById("create-listing"),
        categoryDropdown: document.getElementById("category"),
        eventTicketsFields: document.getElementById("event-tickets-fields"),
        submitListingButton: document.getElementById("submit-listing"),
        signOutButton: document.getElementById("sign-out"),
        sets : document.querySelectorAll(".carousel-set"),
        prevButton : document.querySelector(".carousel-nav.prev"),
        nextButton : document.querySelector(".carousel-nav.next"),
        indicator : document.querySelector(".carousel-indicator"),
    };

    const jwt = retrieveJWT();
    console.log("Retrieved JWT: ", jwt);

    if (!jwt) {
        handleUnauthenticatedUser(elements.titleElement);
        return;
    }

    try {
        const isAuthenticated = await verifyUser(jwt);
        if (isAuthenticated) {
            await handleAuthenticatedUser(elements);
        } else {
            handleUnauthenticatedUser(elements.titleElement);
        }
    } catch (error) {
        console.error("Error verifying user:", error);
        handleUnauthenticatedUser(elements.titleElement);
    }

    // Event listener for submitting a new listing
    elements.submitListingButton.addEventListener("click", async () => {
        await submitListing(jwt);
    });

    // Sign out functionality
    elements.signOutButton.addEventListener("click", signOut);
});

// Modularized Functions

/**
 * Retrieves JWT token from localStorage or URL hash.
 * @returns {string | null} JWT token
 */
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

/**
 * Verifies user authentication by calling the backend.
 * @param {string} jwt - The JWT token
 * @returns {Promise<boolean>} - Whether the user is authenticated
 */
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

/**
 * Handles unauthenticated user actions.
 * @param {HTMLElement} titleElement - The element to display messages
 */
function handleUnauthenticatedUser(titleElement) {
    titleElement.textContent = "Not signed in";
    // window.location.href = 'index.html';
}

/**
 * Handles actions for authenticated users.
 * @param {object} elements - A collection of DOM elements
 */
async function handleAuthenticatedUser(elements) {
    elements.titleElement.textContent = "Signed in";
    let currentIndex = 0;

    // Fetch listings from the backend
    const listings = await fetchListings();

    if (!listings) {
        console.error("Failed to fetch listings");
        return;
    }

    // Populate event cards with fetched listings
    populateEventCards(listings);

    // Put Get Listings Functionality Here
    const updateCarousel = () => {
        elements.sets.forEach((set, index) => {
            set.classList.toggle("active", index === currentIndex);
        });
        elements.indicator.textContent = `${currentIndex + 1} of ${elements.sets.length}`;
        elements.prevButton.disabled = currentIndex === 0;
        elements.nextButton.disabled = currentIndex === elements.sets.length - 1;
    };

    elements.prevButton.addEventListener("click", () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });

    elements.nextButton.addEventListener("click", () => {
        if (currentIndex < elements.sets.length - 1) {
            currentIndex++;
            updateCarousel();
        }
    });

    updateCarousel(); // Initialize carousel

    elements.createListingButton.addEventListener("click", () => {
        showPopup(elements.mainContent, elements.popup);
    });

    elements.closePopupButton.addEventListener("click", () => {
        closePopup(elements.mainContent, elements.popup);
    });

    elements.categoryDropdown.addEventListener("change", () => {
        toggleEventTicketsFields(elements.categoryDropdown, elements.eventTicketsFields);
    });
}

/**
 * Toggles the visibility of event tickets fields based on dropdown selection.
 * @param {HTMLSelectElement} dropdown - The category dropdown
 * @param {HTMLElement} fields - The event tickets fields container
 */
function toggleEventTicketsFields(dropdown, fields) {
    fields.style.display = dropdown.value === "event-tickets" ? "block" : "none";
}

/**
 * Submits a new event listing to the backend.
 * @param {string} jwt - The JWT token
 */
async function submitListing(jwt) {
    const payload = gatherListingInputs();
    if (!payload) return;

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
        clearFields();
    } catch (error) {
        console.error("Error creating event listing:", error);
        alert("An error occurred. Please try again.");
    }
}

/**
 * Gathers input values for a new event listing and validates them.
 * @returns {object | null} - The payload for the new listing or null if invalid
 */
function gatherListingInputs() {
    const eventName = document.getElementById("event-name").value;
    const eventDate = document.getElementById("event-date").value;
    const numberOfTickets = document.getElementById("number-of-tickets").value;
    const price = document.getElementById("price").value;
    const venue = document.getElementById("venue").value;

    if (!eventName || !eventDate || !numberOfTickets || !price || !venue) {
        alert("Please fill out all fields.");
        return null;
    }

    return {
        title: eventName,
        event_date: eventDate,
        number_of_tickets: parseInt(numberOfTickets),
        price: parseFloat(price),
        venue: venue,
    };
}

/**
 * Clears all input fields in the popup form.
 */
function clearFields() {
    document.getElementById("event-name").value = "";
    document.getElementById("event-date").value = "";
    document.getElementById("number-of-tickets").value = "";
    document.getElementById("price").value = "";
    document.getElementById("venue").value = "";
}

/**
 * Signs out the user and redirects to the landing page.
 */
async function signOut() {
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
        console.error("Error signing out:", error);
    }
}

/**
 * Displays the popup and blurs the background.
 * @param {HTMLElement} mainContent - The main content container
 * @param {HTMLElement} popup - The popup container
 */
function showPopup(mainContent, popup) {
    mainContent.classList.add("blur");
    popup.classList.add("visible");
}

/**
 * Hides the popup and unblurs the background.
 * @param {HTMLElement} mainContent - The main content container
 * @param {HTMLElement} popup - The popup container
 */
function closePopup(mainContent, popup) {
    mainContent.classList.remove("blur");
    popup.classList.remove("visible");
}

/**
 * Fetches event listings from the backend.
 * @returns {object} - Dictionary of event listings or null if failed
 */
async function fetchListings() {
    try {
        const response = await fetch("/get-listings", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch listings");
        }

        const data = await response.json();
        return data.listings;
    } catch (error) {
        console.error("Error fetching listings:", error);
        return null;
    }
}


/**
 * Populates the event cards with listing data.
 * @param {object} listings - Dictionary of event listings
 */
function populateEventCards(listings) {
    const eventCards = document.querySelectorAll(".event-card");

    Object.keys(listings).forEach((key, index) => {
        const card = eventCards[index];
        const listing = listings[key];

        if (card && listing) {
            const titleElement = card.querySelector(".event-title");
            const dateElement = card.querySelector(".event-date");

            titleElement.textContent = listing.title;
            dateElement.textContent = new Date(listing.event_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });
        }
    });
}

