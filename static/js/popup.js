document.addEventListener("DOMContentLoaded", () => {
    const parentContainer = document.getElementById("parent-container");
    const loginPopup = document.getElementById("login-popup");
    const loginSignupButton = document.getElementById("login-signup-btn");
    const closeButton = document.getElementById("close-button");
    const body = document.body;
    const registerBtn = document.getElementById('register');
    const loginBtn = document.getElementById('login');

    loginSignupButton.addEventListener("click", () => {
        loginPopup.classList.add("visible");
        body.classList.add("blurred");
    });

    closeButton.addEventListener("click", () => {
        loginPopup.classList.remove("visible");
        body.classList.remove("blurred");
    })

    registerBtn.addEventListener('click', () => {
        loginPopup.classList.add('active');
    });

    loginBtn.addEventListener('click', () => {
        loginPopup.classList.remove('active');
    });

    // Sign Up Functionality

    const signUpForm = document.getElementsByClassName('sign-up')[0]

    signUpForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        let name = document.getElementById('nameSignUp').value;
        let email = document.getElementById('emailSignUp').value;
        let password = document.getElementById('passwordSignUp').value;

        try {
            const response = await fetch("/sign-up", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail);
            }

            alert("Sign up successful! Please verify your email.");

            document.getElementById('nameSignUp').value = '';
            document.getElementById('emailSignUp').value = '';
            document.getElementById('passwordSignUp').value = '';
        } catch (error) {
            console.error("Error during sign up: ", error.message);
            alert("Failed to sign up. Please try again.");
        }
    })

    // Sign In Functionality

    const signInForm = document.getElementsByClassName('sign-in')[0]

    signInForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        let email = document.getElementById('emailSignIn').value;
        let password = document.getElementById('passwordSignIn').value;

        try {
            const response = await fetch("/sign-in", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail);
            }

            const data = await response.json();
            const token = data["session"]["access_token"];
            localStorage.setItem('access_token', token);
            window.location.href = '/dashboard';
        } catch (error) {
            console.error("Error signing in: ", error.message);
            alert("Failed to sign in. Please check your credentials and try again.");
        }
    })
})