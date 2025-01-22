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

        const statusPrice = document.querySelector(".status-price");
        const priceInput = document.querySelector('.price-dollars');
        const progressBarPrice = document.querySelector(".progress-bar-price");

        // 2) Regex for a whole number + decimal point + exactly 2 digits
        //    Examples of valid input:  "0.00", "12.34", "999.99"
        //    Invalid: "12", "12.3", ".50", "12.345"
        const dollarFormatRegex = /^\d+\.\d{2}$/;
        priceInput.addEventListener("input", () => {
            const value = priceInput.value.trim();

            if (dollarFormatRegex.test(value)) {
                progressBarPrice.style.width = "50%";
                statusPrice.textContent = "Correct format.";
                statusPrice.style.color = "#4caf50";
                progressBarPrice.style.backgroundColor = "#4caf50";

            } else {
                progressBarPrice.style.width = "1%";
                statusPrice.textContent = "Incorrect format.";
                statusPrice.style.color = "#ff4d4d";
                progressBarPrice.style.backgroundColor = "#ff4d4d";
            }

        })

        const popupDateSelectionContainer = document.querySelector(".popup-date-selection-container");
        const selectDateButton = document.getElementById("select-date");
        let selectedDate = false;
        selectDateButton.addEventListener("click", () => {
            popupDateSelectionContainer.classList.toggle("active");

            const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            let currentMonth = 0; // January
            let currentYear = 2025;
            let currentDay = 0;

            const calendarHeader = document.querySelector(".month-year");
            const calendarGrid = document.querySelector(".calendar-grid");

            function updateCalendarDaysButtonFunctionality() {
                const calendarDays = document.querySelectorAll(".calendar-row span");

                calendarDays.forEach(day => {
                    day.addEventListener("click", () => {
                        calendarDays.forEach(d => d.classList.remove("selected"));
                        day.classList.add("selected");
                        selectedDate = true;
                        currentDay = day.innerText;
                        const hourValue = dateInputs[0].value.trim();
                        const minuteValue = dateInputs[1].value.trim();

                        if (selectedDate && regexHours.test(hourValue) && regexMinutes.test(minuteValue)) {
                            progressBarDate.style.width = "50%";
                            statusDate.textContent = "Correct format.";
                            statusDate.style.color = "#4caf50";
                            progressBarDate.style.backgroundColor = "#4caf50";
                            selectDateButton.innerText = `${monthNames[currentMonth]} ${currentDay}, ${currentYear} | ${hourValue}:${minuteValue}`;
                        } else {
                            progressBarDate.style.width = "1%";
                            statusDate.textContent = "Incorrect format.";
                            statusDate.style.color = "#ff4d4d";
                            progressBarDate.style.backgroundColor = "#ff4d4d";
                            selectDateButton.innerText = "Click to select date.";
                        }
                    });
                });
            }

            function updateCalendar() {
                // Update month and year in the header
                calendarHeader.querySelector(".current-month").textContent = monthNames[currentMonth];
                calendarHeader.querySelector(".current-year").textContent = currentYear;

                // Clear existing calendar rows (skip the days-of-week header)
                const calendarRows = Array.from(calendarGrid.querySelectorAll(".calendar-row"));
                calendarRows.forEach(row => row.remove());

                // Calculate first day of the current month and days in the month
                const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
                const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

                // Calculate the total cells required
                const totalDays = firstDay + daysInMonth; // Days from previous + current month
                const totalRows = Math.ceil(totalDays / 7); // Number of weeks required

                // Generate the grid
                let calendarHTML = "";
                let dayCount = 1 - firstDay; // Start from the previous month's remaining days

                for (let row = 0; row < totalRows; row++) {
                    let weekHTML = "<div class='calendar-row'>";
                    for (let col = 0; col < 7; col++) {
                        if (dayCount < 1) {
                            // Previous month's days
                            weekHTML += `<span class="disabled">${daysInPrevMonth + dayCount}</span>`;
                        } else if (dayCount > daysInMonth) {
                            // Next month's days
                            weekHTML += `<span class="disabled">${dayCount - daysInMonth}</span>`;
                        } else {
                            // Current month's days
                            weekHTML += `<span>${dayCount}</span>`;
                        }
                        dayCount++;
                    }
                    weekHTML += "</div>";
                    calendarHTML += weekHTML;
                }

                // Append the dynamically generated rows to the calendar grid
                calendarGrid.innerHTML += calendarHTML;
                updateCalendarDaysButtonFunctionality();
            }


            // Increment month
            document.querySelector(".increment-month-button:first-of-type").addEventListener("click", () => {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                updateCalendar();
                selectedDate = false;
                progressBarDate.style.width = "1%";
                statusDate.textContent = "Incorrect format.";
                statusDate.style.color = "#ff4d4d";
                progressBarDate.style.backgroundColor = "#ff4d4d";
                selectDateButton.innerText = "Click to select date.";
            });

            // Decrement month
            document.querySelector(".increment-month-button:last-of-type").addEventListener("click", () => {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                updateCalendar();
                selectedDate = false;
                progressBarDate.style.width = "1%";
                statusDate.textContent = "Incorrect format.";
                statusDate.style.color = "#ff4d4d";
                progressBarDate.style.backgroundColor = "#ff4d4d";
                selectDateButton.innerText = "Click to select date.";
            });

            // Initialize calendar
            updateCalendar();

            const regexHours = /^(0[0-9]|1[0-9]|2[0-3])$/;
            const regexMinutes = /^[0-5][0-9]$/;
            const dateInputs = [document.getElementById("HH-input"), document.getElementById("MM-input")];
            const statusDate = document.querySelector(".status-date");
            const progressBarDate = document.querySelector(".progress-bar-date");

            dateInputs.forEach((input) => {
                input.addEventListener("input", () => {
                    const hourValue = dateInputs[0].value.trim();
                    const minuteValue = dateInputs[1].value.trim();

                    if (selectedDate && regexHours.test(hourValue) && regexMinutes.test(minuteValue)) {
                        progressBarDate.style.width = "50%";
                        statusDate.textContent = "Correct format.";
                        statusDate.style.color = "#4caf50";
                        progressBarDate.style.backgroundColor = "#4caf50";
                        selectDateButton.innerText = `${monthNames[currentMonth]} ${currentDay}, ${currentYear} | ${hourValue}:${minuteValue}`;
                    } else {
                        progressBarDate.style.width = "1%";
                        statusDate.textContent = "Incorrect format.";
                        statusDate.style.color = "#ff4d4d";
                        progressBarDate.style.backgroundColor = "#ff4d4d";
                        selectDateButton.innerText = "Click to select date.";
                    }
                });
            })

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