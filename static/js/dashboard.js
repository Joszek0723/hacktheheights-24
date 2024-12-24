// Store the Handlebars templateCarousel in a variable
const sourceCarousel = document.getElementById("carousel-template").innerHTML;
const templateCarousel = Handlebars.compile(sourceCarousel);

let currentIndex = 0;

document.addEventListener("DOMContentLoaded", async () => {
    // Define essential DOM elements
    const elements = getDOMElements();

    // Retrieve JWT for authentication
    const jwt = retrieveJWT();
    console.log("Retrieved JWT: ", jwt);

    // Handle user authentication
    if (!jwt) {
        handleUnauthenticatedUser();
        return;
    }

    try {
        const isAuthenticated = await verifyUser(jwt);
        if (isAuthenticated) {
            await handleAuthenticatedUser(elements, jwt);
        } else {
            handleUnauthenticatedUser();
        }
    } catch (error) {
        console.error("Error verifying user:", error);
        handleUnauthenticatedUser();
    }
});

/**
 * Retrieves all required DOM elements in a single object for easier reference.
 * @returns {object} Object containing references to DOM elements.
 */
function getDOMElements() {
    return {
        mainContent: document.getElementById("mainContent"),
        popup: document.getElementById("popup"),
        closePopupButton: document.getElementById("close-popup"),
        createListingButton: document.getElementById("create-listing"),
        categoryDropdown: document.getElementById("category"),
        eventTicketsFields: document.getElementById("event-tickets-fields"),
        submitListingButton: document.getElementById("submit-listing"),
        signOutButton: document.getElementById("sign-out"),
        prevButton: document.querySelector(".carousel-nav.prev"),
        nextButton: document.querySelector(".carousel-nav.next"),
        indicator: document.querySelector(".carousel-indicator"),
        carouselContainer: document.querySelector(".carousel-container"),
        userIcon: document.querySelector('.user-icon'),
        dropdownMenu: document.querySelector('.dropdown-menu'),
    };
}

/**
 * Retrieves the JWT token from localStorage or URL hash.
 * @returns {string | null} JWT token if available, otherwise null.
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

function getTimeOfDay() {
    const now = new Date();
    const hour = now.getHours();

    let timeOfDay;

    if (hour < 12) {
        timeOfDay = 'morning';
    } else if (hour < 18) {
        timeOfDay = 'afternoon';
    } else {
    timeOfDay = 'evening';
    }
    return timeOfDay
}

/**
 * Verifies user authentication by calling the backend with the JWT.
 * @param {string} jwt - The JWT token.
 * @returns {Promise<boolean>} True if the user is authenticated, otherwise false.
 */
async function verifyUser(jwt) {
    const sourceGreeting = document.getElementById("greeting-template").innerHTML;
    const templateGreeting = Handlebars.compile(sourceGreeting);
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
    const htmlGreeting = templateGreeting({
        name: data.name.split(" ")[0],
        time_of_day: getTimeOfDay()
    });
    document.querySelector(".greeting").innerHTML = htmlGreeting;
    return data.user && data.user.role === "authenticated";
}

/**
 * Handles the UI for unauthenticated users.
 * @param {HTMLElement} titleElement - Element to display the "not signed in" message.
 */
function handleUnauthenticatedUser() {
    console.log("Not Signed In.");
    window.location.href = "/";
    // Redirect logic can be added if required
}

function updateCarousel(elements) {
    document.querySelectorAll(".carousel-set").forEach((set, index) => {
        set.classList.toggle("active", index === currentIndex); 
    });
    elements.indicator.textContent = `${currentIndex + 1} of ${document.querySelectorAll(".carousel-set").length}`;
    elements.prevButton.disabled = currentIndex === 0;
    elements.nextButton.disabled = currentIndex === document.querySelectorAll(".carousel-set").length - 1;
};

function renderProfileDropdownMenu(elements) {
    // Toggle dropdown on user icon click
    elements.userIcon.addEventListener('click', (e) => {
        e.preventDefault();
        elements.dropdownMenu.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.userIcon.contains(e.target) && !elements.dropdownMenu.contains(e.target)) {
            elements.dropdownMenu.classList.remove('show');
        }
    });
}

/**
 * Handles authenticated user actions, including initializing the carousel and adding event listeners.
 * @param {object} elements - Object containing references to DOM elements.
 * @param {string} jwt - The JWT token for the user.
 */
async function handleAuthenticatedUser(elements, jwt) {
    renderProfileDropdownMenu(elements);

    await updateEventCards();
    updateCarousel(elements); // Initialize carousel

    elements.prevButton.addEventListener("click", () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel(elements);
        }
    });

    elements.nextButton.addEventListener("click", () => {
        if (currentIndex < document.querySelectorAll(".carousel-set").length - 1) {
            currentIndex++;
            updateCarousel(elements);
        }
    });

    elements.createListingButton.addEventListener("click", () => {
        showPopup(elements.mainContent, elements.popup);
    });

    elements.closePopupButton.addEventListener("click", () => {
        closePopup(elements.mainContent, elements.popup);
    });

    elements.categoryDropdown.addEventListener("change", () => {
        toggleEventTicketsFields(elements.categoryDropdown, elements.eventTicketsFields);
    });

    elements.submitListingButton.addEventListener("click", async () => {
        await submitListing(elements, jwt);
    });

    elements.signOutButton.addEventListener("click", signOut);
}

/**
 * Fetches event listings and populates the carousel.
 * @async
 * @function updateEventCards
 */
async function updateEventCards() {
    const listings = await fetchListings();
    if (!listings) {
        console.error("Failed to fetch listings");
        return;
    }
    await populateEventCards(listings);
}

/**
 * Fetches event listings from the backend.
 * @returns {object | null} Event listings or null if fetching fails.
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
 * Populates the carousel with event cards using Handlebars.
 * @param {object} listings - Event listings to display.
 */
async function populateEventCards(listings) {
    const groupEvents = (events, groupSize) => {
        const sets = [];
        for (let i = 0; i < events.length; i += groupSize) {
            sets.push(events.slice(i, i + groupSize));
        }
        return sets;
    };

    const groupedListings = groupEvents(listings, 4);

    const htmlCarousel = templateCarousel({
        sets: groupedListings,
    });

    document.querySelector(".carousel-container").innerHTML = htmlCarousel;
}

/**
 * Submits a new event listing to the backend.
 * @param {string} jwt - The JWT token.
 */
async function submitListing(elements, jwt) {
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
        await updateEventCards();
        updateCarousel(elements);
    } catch (error) {
        console.error("Error creating event listing:", error);
        alert("An error occurred. Please try again.");
    }
}

/**
 * Gathers input values for a new event listing and validates them.
 * @returns {object | null} Payload for the new listing or null if invalid.
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
 * Toggles the visibility of event tickets fields based on dropdown selection.
 * @param {HTMLSelectElement} dropdown - The category dropdown.
 * @param {HTMLElement} fields - The event tickets fields container.
 */
function toggleEventTicketsFields(dropdown, fields) {
    fields.style.display = dropdown.value === "event-tickets" ? "block" : "none";
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
            window.location.href = "/";
        } else {
            console.error("Failed to sign out.");
        }
    } catch (error) {
        console.error("Error signing out:", error);
    }
}

/**
 * Displays the popup and blurs the background.
 * @param {HTMLElement} mainContent - The main content container.
 * @param {HTMLElement} popup - The popup container.
 */
function showPopup(mainContent, popup) {
    mainContent.classList.add("blur");
    popup.classList.add("visible");
}

/**
 * Hides the popup and unblurs the background.
 * @param {HTMLElement} mainContent - The main content container.
 * @param {HTMLElement} popup - The popup container.
 */
function closePopup(mainContent, popup) {
    mainContent.classList.remove("blur");
    popup.classList.remove("visible");
}

/**
 * Handlebars helper to format ISO dates into readable strings.
 * @param {string} isoDate - ISO date string.
 * @returns {string} Formatted date string.
 */
Handlebars.registerHelper("formatDate", function (isoDate) {
    const options = { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "numeric" };
    return new Intl.DateTimeFormat("en-US", options).format(new Date(isoDate));
});
