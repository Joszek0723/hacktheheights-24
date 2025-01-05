import { retrieveJWT, signOut } from "./helperFunctions.js";

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

    const toggleButton = document.getElementById('toggle-button');
    const toggleContainer = document.querySelector('.toggle-button-container');

    toggleButton.addEventListener('click', () => {
        toggleButton.classList.toggle('active');
        toggleContainer.classList.toggle('active');
    });

    const inbox = document.querySelector('.inbox');
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
        if (!document.querySelector('.user-icon').contains(e.target) && !document.querySelector('.dropdown-menu').contains(e.target)) {
            document.querySelector('.dropdown-menu').classList.remove('show');
        }
    });

    const myListingsTab = document.getElementById("my-listings-tab");
    const otherTabs = [document.getElementById("saved-listings-tab"), document.getElementById("history-tab")];
    const carouselContainer = document.querySelector(".carousel-container");

    const myListingsTemplateSource = document.getElementById("carousel-template").innerHTML;
    const myListingsTemplate = Handlebars.compile(myListingsTemplateSource);

    myListingsTab.addEventListener("click", () => {
        carouselContainer.innerHTML = myListingsTemplate({});
    });

    otherTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            carouselContainer.innerHTML = "";
        });
    });

    document.getElementById("sign-out").addEventListener("click", signOut);
}

async function handleUnauthenticatedUser() {
    console.log("NOT SIGNED IN");
}