"use strict";

(() => {
    const STORAGE_KEYS = Object.freeze({
        users: "tokenTroveUsers",
        session: "tokenTroveSession",
        theme: "tokenTroveTheme"
    });

    const dom = {
        form: document.getElementById("signup-form"),
        usernameInput: document.getElementById("signup-username"),
        emailInput: document.getElementById("signup-email"),
        passwordInput: document.getElementById("signup-password"),
        confirmPasswordInput: document.getElementById("signup-confirm-password"),
        submitButton: document.getElementById("signup-submit"),
        message: document.getElementById("form-message"),
        themeToggle: document.getElementById("theme-toggle"),
        pageLoader: document.getElementById("page-loader"),
        loaderText: document.getElementById("loader-text"),
        toast: document.getElementById("app-toast"),
        passwordToggles: Array.from(document.querySelectorAll("[data-toggle-password]"))
    };

    function safeParse(value, fallback) {
        try {
            return JSON.parse(value) || fallback;
        } catch (error) {
            return fallback;
        }
    }

    function getUsers() {
        const users = safeParse(localStorage.getItem(STORAGE_KEYS.users), []);
        return Array.isArray(users) ? users : [];
    }

    function saveUsers(users) {
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    }

    function saveSession(user) {
        const session = { userId: user.id, username: user.username, email: user.email, loginAt: new Date().toISOString()};
        localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    }

    function normaliseText(value, maximumLength = 100) {
        return String(value || "").replace(/\s+/g, " ").trim().slice(0, maximumLength);
    }

    function showLoader(isVisible, text = "Please wait...") {
        if (!dom.pageLoader) {
            return;
        }

        dom.loaderText.textContent = text;
        dom.pageLoader.classList.toggle("is-visible", isVisible);
    }

    function showToast(message, type = "success") {
        if (!dom.toast) {
            return;
        }

        dom.toast.textContent = message;
        dom.toast.className = `toast is-visible is-${type}`;

        window.clearTimeout(showToast.timer);

        showToast.timer = window.setTimeout(() => {
            dom.toast.className = "toast";
        }, 3200);
    }

    function showMessage(message, type = "error") {
        if (!dom.message) {
            return;
        }

        dom.message.textContent = message;
        dom.message.className = type === "success" ? "form-message is-success" : "form-message";
    }

    function clearMessage() {
        showMessage("");
    }

    function markInvalid(input) {
        input?.setAttribute("aria-invalid", "true");
    }

    function clearInvalid(input) {
        input?.removeAttribute("aria-invalid");
    }

    function setSubmitState(isLoading) {
        dom.submitButton.disabled = isLoading;

        const label = dom.submitButton.querySelector("span");

        if (label) {
            label.textContent = isLoading ? "Creating account..." : "Create account";
        }
    }

    async function hashText(value) {
        const safeValue = String(value || "");

        if (window.crypto && window.crypto.subtle && window.TextEncoder) {
            const data = new TextEncoder().encode(safeValue);
            const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
        }

        return window.btoa(unescape(encodeURIComponent(safeValue)));
    }

    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidUsername(username) {
        return /^[a-zA-Z0-9_ ]{3,30}$/.test(username);
    }

    function isValidPassword(password) {
        return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
    }

    function applyTheme(theme) {
        const safeTheme = theme === "dark" ? "dark" : "light";

        document.documentElement.dataset.theme = safeTheme;

        if (!dom.themeToggle) {
            return;
        }

        dom.themeToggle.setAttribute("aria-pressed", String(safeTheme === "dark"));

        const icon = dom.themeToggle.querySelector(".theme-toggle__icon");
        const text = dom.themeToggle.querySelector(".theme-toggle__text");

        if (icon) {
            icon.textContent = safeTheme === "dark" ? "☀" : "☾";
        }

        if (text) {
            text.textContent = safeTheme === "dark" ? "Light mode" : "Dark mode";
        }
    }

    function initialiseTheme() {
        const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
        const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const defaultTheme = storedTheme || (preferredDark ? "dark" : "light");

        applyTheme(defaultTheme);

        dom.themeToggle?.addEventListener("click", () => {
            const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
            localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
            applyTheme(nextTheme);
            showToast(`${nextTheme === "dark" ? "Dark" : "Light"} mode enabled.`, "success");
        });
    }

    function initialisePasswordToggles() {
        dom.passwordToggles.forEach((button) => {
            button.addEventListener("click", () => {
                const inputId = button.dataset.togglePassword;
                const input = document.getElementById(inputId);

                if (!input) {
                    return;
                }

                const isPassword = input.type === "password";

                input.type = isPassword ? "text" : "password";
                button.textContent = isPassword ? "Hide" : "Show";
            });
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        clearMessage();
        [dom.usernameInput, dom.emailInput, dom.passwordInput, dom.confirmPasswordInput ].forEach(clearInvalid);
        const username = normaliseText(dom.usernameInput.value, 30);
        const email = normaliseText(dom.emailInput.value, 100).toLowerCase();
        const password = normaliseText(dom.passwordInput.value, 120);
        const confirmPassword = normaliseText(dom.confirmPasswordInput.value, 120);

        if (!username) {
            markInvalid(dom.usernameInput);
            showMessage("Enter a username.");
            dom.usernameInput.focus();
            return;
        }

        if (!isValidUsername(username)) {
            markInvalid(dom.usernameInput);
            showMessage("Username must be 3 to 30 characters and may contain letters, numbers, spaces, or underscores.");
            dom.usernameInput.focus();
            return;
        }

        if (!email) {
            markInvalid(dom.emailInput);
            showMessage("Enter your email address.");
            dom.emailInput.focus();
            return;
        }

        if (!isValidEmail(email)) {
            markInvalid(dom.emailInput);
            showMessage("Enter a valid email address.");
            dom.emailInput.focus();
            return;
        }

        if (!isValidPassword(password)) {
            markInvalid(dom.passwordInput);
            showMessage("Password must be at least 8 characters and include letters and numbers.");
            dom.passwordInput.focus();
            return;
        }

        if (password !== confirmPassword) {
            markInvalid(dom.confirmPasswordInput);
            showMessage("Passwords do not match.");
            dom.confirmPasswordInput.focus();
            return;
        }

        const users = getUsers();
        const usernameLower = username.toLowerCase();

        const existingUser = users.find((user) => {
            return (
                normaliseText(user.username, 30).toLowerCase() === usernameLower || normaliseText(user.email, 100).toLowerCase() === email
            );
        });

        if (existingUser) {
            showMessage("A user with that username or email already exists.");
            showToast("That username or email is already in use.", "error");
            return;
        }

        setSubmitState(true);
        showLoader(true, "Creating your account...");

        try {
            const passwordHash = await hashText(password);
            const newUser = {id: createId(), username, email, passwordHash, createdAt: new Date().toISOString()};
            users.push(newUser);
            saveUsers(users);
            saveSession(newUser);

            showMessage("Account created successfully.", "success");
            showToast("Account created. Redirecting to dashboard...", "success");

            window.setTimeout(() => {
                window.location.href = "Dashboard.html";
            }, 900);
        } catch (error) {
            showLoader(false);
            setSubmitState(false);
            showMessage("Unable to create your account right now.");
            showToast("Unable to create your account right now.", "error");
        }
    }

    function redirectIfLoggedIn() {
        const session = safeParse(localStorage.getItem(STORAGE_KEYS.session), null);

        if (session && session.userId) {
            window.location.href = "Dashboard.html";
        }
    }

    function registerEvents() {
        dom.form?.addEventListener("submit", handleSubmit);

        [dom.usernameInput, dom.emailInput, dom.passwordInput, dom.confirmPasswordInput].forEach((input) => {
            input?.addEventListener("input", () => {
                clearInvalid(input);
                clearMessage();
            });
        });
    }

    function initialise() {
        redirectIfLoggedIn();
        initialiseTheme();
        initialisePasswordToggles();
        registerEvents();
        showLoader(false);
    }

    initialise();
})();
