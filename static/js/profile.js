import { fetchMyListings, retrieveJWT, signOut } from "./helperFunctions.js";

document.addEventListener("DOMContentLoaded", async () => {
    const tabs = document.querySelectorAll('.tab');
    const slider = document.querySelector('.slider');

    function updateSliderPosition(index) {
        const tabWidth = tabs[index].offsetWidth; // Width of a single tab
        console.log(tabWidth);
        const sliderOffset = (tabWidth - slider.offsetWidth) / 2; // Center the slider within the tab
        slider.style.transform = `translateX(${index * tabWidth + sliderOffset}px) translateY(-50%)`;
    }

    // Recalculate the slider position and size on window resize
    function handleResize() {
        const activeTabIndex = [...tabs].findIndex(tab => tab.classList.contains('active'));
        console.log(activeTabIndex);
        updateSliderPosition(activeTabIndex >= 0 ? activeTabIndex : 0);
    }

    // Initialize the slider position
    updateSliderPosition(0); // Start with the first tab

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));

            // Add active class to the clicked tab
            tab.classList.add('active');

            // Update the slider position
            updateSliderPosition(index);
        });
    });

    // Add resize event listener
    window.addEventListener('resize', handleResize);

    // const inbox = document.querySelector('.inbox');
    const collapseBtn = document.getElementById('collapse-btn');
    // const main = document.querySelector('.main');
    const container = document.querySelector('.container');

    container.addEventListener('transitionend', (e) => {
        // Check if the transition ended on the container’s grid-template-columns
        if (e.target === container && e.propertyName === 'grid-template-columns') {
            handleResize(); // recalc the slider
        }
    });

    // Add click event listener for collapsing/expanding the inbox
    collapseBtn.addEventListener('click', () => {
        // inbox.classList.toggle('collapsed');
        container.classList.toggle('inbox-collapsed');
        collapseBtn.classList.toggle('expanded');
    });

    const jwt = retrieveJWT()
    try {
        const [isAuthenticated, userData] = await verifyUser(jwt);
        if (isAuthenticated) {
            await handleAuthenticatedUser(userData);
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
    return [data.user && data.user.role === "authenticated", data];
}

async function displayMyListings(supabaseAuthId, userName) {
    console.log(supabaseAuthId, userName);
    const myListings = await fetchMyListings(supabaseAuthId, userName);
    if (!myListings) {
        console.error("Failed to fetch listings");
        return;
    }
    console.log(myListings);
    return myListings;
}

function getDOMElements() {
    return {
        userIcon: document.querySelector(".user-icon"),
        dropdownMenu: document.querySelector(".dropdown-menu"),
        carouselContainer: document.querySelector(".carousel-container"),

        savedListingsTab: document.getElementById("saved-listings-tab"),
        myListingsTab: document.getElementById("my-listings-tab"),
        historyTab: document.getElementById("history-tab"),

        createTicketsListing: document.getElementById("create-tickets-listing"),
        createSpacesListing: document.getElementById("create-spaces-listing"),
        createItemsListing: document.getElementById("create-items-listing"),
        createBooksListing: document.getElementById("create-books-listing"),

        toggleButton: document.getElementById('toggle-button'),
        toggleContainer: document.querySelector('.toggle-button-container'),
        createTicketsListingButton: document.getElementById("create-tickets-listing"),
    }
}

async function handleAuthenticatedUser(userData) {
    const elements = getDOMElements();
    const myListingsTemplateSource = document.getElementById("carousel-template").innerHTML;
    const myListingsTemplate = Handlebars.compile(myListingsTemplateSource);
    const createTicketsListingTemplateSource = document.getElementById("create-tickets-listing-template").innerHTML;
    const createTicketsListingTemplate = Handlebars.compile(createTicketsListingTemplateSource);

    elements.toggleButton.addEventListener('click', () => {
        elements.toggleButton.classList.toggle('active');
        elements.toggleContainer.classList.toggle('active');
    });

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

    const otherTabs = [document.getElementById("saved-listings-tab"), document.getElementById("history-tab")];

    elements.myListingsTab.addEventListener("click", async () => {
        const groupEvents = (events, groupSize) => {
            const sets = [];
            for (let i = 0; i < events.length; i += groupSize) {
                sets.push(events.slice(i, i + groupSize));
            }
            return sets;
        };

        const myListings = await displayMyListings(userData.user.id, userData.name);
        const groupedMyListings = groupEvents(myListings, 4);
        elements.carouselContainer.innerHTML = myListingsTemplate({
            sets: groupedMyListings,
        });
    });

    elements.createTicketsListingButton.addEventListener("click", async () => {
        elements.carouselContainer.innerHTML = createTicketsListingTemplate({});
        elements.toggleButton.classList.toggle('active');
        elements.toggleContainer.classList.toggle('active');
        // 1) Reusable function for handling input updates
        function attachInputListener({
            inputField,
            progressBar,
            charCount,
            status,
            thresholds = [25, 50],    // Adjust thresholds as needed
            fallbackProgress = 0.4,   // If progress is 0, use fallback
        }) {
            inputField.addEventListener("input", () => {
                const maxLength = inputField.maxLength;
                const currentLength = inputField.value.length;

                // Calculate progress and handle "0" special case
                const rawPercentage = (currentLength / maxLength) * 100;
                const progressPercentage = rawPercentage === 0 ? fallbackProgress : rawPercentage;
                progressBar.style.width = `${progressPercentage}%`;

                // Update character count text
                charCount.textContent = `${currentLength}/${maxLength}`;
                if (currentLength < thresholds[0]) {
                    status.textContent = "May be too brief.";
                    status.style.color = "#ff4d4d";
                    progressBar.style.backgroundColor = "#ff4d4d";
                } else if (currentLength < thresholds[1]) {
                    status.textContent = "Medium length.";
                    status.style.color = "#ffb400";
                    progressBar.style.backgroundColor = "#ffb400";
                } else {
                    status.textContent = "Ideal length.";
                    status.style.color = "#4caf50";
                    progressBar.style.backgroundColor = "#4caf50";
                }
            });
        }

        // 2) Attach for 'description' input
        attachInputListener({
            inputField: document.getElementById("description-input"),
            progressBar: document.querySelector(".progress-bar"),
            charCount: document.querySelector(".character-count"),
            status: document.querySelector(".status"),
            thresholds: [25, 50],   // for description
            fallbackProgress: 0.4,
        });

        // 3) Attach for 'title' input
        attachInputListener({
            inputField: document.getElementById("title-input"),
            progressBar: document.querySelector(".progress-bar-title"),
            charCount: document.querySelector(".character-count-title"),
            status: document.querySelector(".status-title"),
            thresholds: [10, 25],   // for title
            fallbackProgress: 2,
        });

    })

    otherTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            elements.carouselContainer.innerHTML = "";
        });
    });

    document.getElementById("sign-out").addEventListener("click", signOut);
}

async function handleUnauthenticatedUser() {
    console.log("NOT SIGNED IN");
}