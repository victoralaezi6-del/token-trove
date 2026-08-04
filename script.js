"use strict";

(() => {
    const STORAGE_KEYS = Object.freeze({
        users: "tokenTroveUsers",
        session: "tokenTroveSession",
        theme: "tokenTroveTheme"
    });

    const dom = {
        form: document.getElementById("login-form"),
        identifierInput: document.getElementById("login-identifier"),
        passwordInput: document.getElementById("login-password"),
        submitButton: document.getElementById("login-submit"),
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
        if (!input) {
            return;
        }

        input.setAttribute("aria-invalid", "true");
    }

    function clearInvalid(input) {
        if (!input) {
            return;
        }

        input.removeAttribute("aria-invalid");
    }

    function setSubmitState(isLoading) {
        dom.submitButton.disabled = isLoading;

        const label = dom.submitButton.querySelector("span");

        if (label) {
            label.textContent = isLoading ? "Signing in..." : "Sign in";
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

    function saveSession(user) {
        const session = {
            userId: user.id,
            username: user.username,
            email: user.email,
            loginAt: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
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
        clearInvalid(dom.identifierInput);
        clearInvalid(dom.passwordInput);

        const identifier = normaliseText(dom.identifierInput.value, 80).toLowerCase();
        const password = normaliseText(dom.passwordInput.value, 120);

        if (!identifier) {
            markInvalid(dom.identifierInput);
            showMessage("Enter your username or email.");
            dom.identifierInput.focus();
            return;
        }

        if (!password) {
            markInvalid(dom.passwordInput);
            showMessage("Enter your password.");
            dom.passwordInput.focus();
            return;
        }

        const users = getUsers();

        if (users.length === 0) {
            showMessage("No account found yet. Create an account first.");
            showToast("Create an account before signing in.", "error");
            return;
        }

        setSubmitState(true);
        showLoader(true, "Signing you in...");

        try {
            const matchedUser = users.find((user) => {
                const username = normaliseText(user.username, 30).toLowerCase();
                const email = normaliseText(user.email, 100).toLowerCase();

                return username === identifier || email === identifier;
            });

            if (!matchedUser) {
                throw new Error("Account not found.");
            }

            const passwordHash = await hashText(password);

            if (matchedUser.passwordHash !== passwordHash) {
                throw new Error("Incorrect password.");
            }

            saveSession(matchedUser);
            showMessage("Login successful.", "success");
            showToast("Login successful. Redirecting...", "success");

            window.setTimeout(() => {
                window.location.href = "Dashboard.html";
            }, 800);
        } catch (error) {
            showLoader(false);
            setSubmitState(false);
            const message = error instanceof Error ? error.message : "Unable to sign in right now.";
            showMessage(message);
            showToast(message, "error");
        }
    }

    function redirectIfLoggedIn() {
        const session = safeParse(localStorage.getItem(STORAGE_KEYS.session), null);

        if (session && session.userId) {
            window.location.href = "dashboard.html";
        }
    }

    function registerEvents() {
        dom.form?.addEventListener("submit", handleSubmit);

        [dom.identifierInput, dom.passwordInput].forEach((input) => {
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
