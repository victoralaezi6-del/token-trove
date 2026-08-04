"use strict";

(() => {
    const CONFIG = Object.freeze({
        themeKey: "tokenTroveTheme",
        sessionKey: "tokenTroveSession"
    });

    const reducedMotionQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    const darkModeQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
    );

    const elements = {
        menuButton:
            document.getElementById("landing-menu-button"),

        navigation:
            document.getElementById("landing-navigation"),

        navigationLinks: Array.from(
            document.querySelectorAll(
                ".landing-navigation a"
            )
        ),

        themeToggle:
            document.getElementById("theme-toggle"),

        themeIcon:
            document.querySelector(
                ".theme-toggle__icon"
            ),

        themeText:
            document.querySelector(
                ".theme-toggle__text"
            ),

        currentYear:
            document.getElementById("current-year"),

        loginLink:
            document.getElementById("login-link"),

        signupLink:
            document.getElementById("signup-link"),

        heroAction:
            document.getElementById(
                "primary-hero-action"
            ),

        bottomPrimaryAction:
            document.getElementById(
                "bottom-primary-action"
            ),

        bottomLoginAction:
            document.getElementById(
                "bottom-login-action"
            ),

        revealElements: Array.from(
            document.querySelectorAll(
                ".reveal-element"
            )
        )
    };

    function safeStorageGet(key) {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    function safeStorageSet(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch {
            return false;
        }
    }

    function safeParse(value, fallback = null) {
        if (!value) {
            return fallback;
        }

        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    function applyTheme(theme) {
        const safeTheme =
            theme === "dark"
                ? "dark"
                : "light";

        const isDark =
            safeTheme === "dark";

        document.documentElement.dataset.theme =
            safeTheme;

        elements.themeToggle?.setAttribute(
            "aria-pressed",
            String(isDark)
        );

        elements.themeToggle?.setAttribute(
            "aria-label",
            isDark
                ? "Switch to light mode"
                : "Switch to dark mode"
        );

        if (elements.themeIcon) {
            elements.themeIcon.textContent =
                isDark ? "☀" : "☾";
        }

        if (elements.themeText) {
            elements.themeText.textContent =
                isDark
                    ? "Light mode"
                    : "Dark mode";
        }
    }

    function initialiseTheme() {
        const storedTheme = safeStorageGet(
            CONFIG.themeKey
        );

        const initialTheme =
            storedTheme === "dark" ||
            storedTheme === "light"
                ? storedTheme
                : darkModeQuery.matches
                    ? "dark"
                    : "light";

        applyTheme(initialTheme);
    }

    function toggleTheme() {
        const currentTheme =
            document.documentElement.dataset.theme;

        const nextTheme =
            currentTheme === "dark"
                ? "light"
                : "dark";

        applyTheme(nextTheme);

        safeStorageSet(
            CONFIG.themeKey,
            nextTheme
        );
    }

    function openNavigation() {
        elements.navigation?.classList.add(
            "is-open"
        );

        elements.menuButton?.classList.add(
            "is-active"
        );

        elements.menuButton?.setAttribute(
            "aria-expanded",
            "true"
        );

        elements.menuButton?.setAttribute(
            "aria-label",
            "Close navigation menu"
        );
    }

    function closeNavigation() {
        elements.navigation?.classList.remove(
            "is-open"
        );

        elements.menuButton?.classList.remove(
            "is-active"
        );

        elements.menuButton?.setAttribute(
            "aria-expanded",
            "false"
        );

        elements.menuButton?.setAttribute(
            "aria-label",
            "Open navigation menu"
        );
    }

    function toggleNavigation() {
        const isOpen =
            elements.navigation?.classList.contains(
                "is-open"
            );

        if (isOpen) {
            closeNavigation();
        } else {
            openNavigation();
        }
    }

    function initialiseAccountActions() {
        const session = safeParse(
            safeStorageGet(CONFIG.sessionKey)
        );

        if (!session?.userId) {
            return;
        }

        if (elements.loginLink) {
            elements.loginLink.href =
                "Dashboard.html";

            elements.loginLink.textContent =
                "Dashboard";
        }

        if (elements.signupLink) {
            elements.signupLink.href =
                "Dashboard.html";

            elements.signupLink.textContent =
                "Open dashboard";
        }

        if (elements.heroAction) {
            elements.heroAction.href =
                "Dashboard.html";

            elements.heroAction.firstChild.textContent =
                "Open your dashboard ";
        }

        if (elements.bottomPrimaryAction) {
            elements.bottomPrimaryAction.href =
                "Dashboard.html";

            elements.bottomPrimaryAction.textContent =
                "Open dashboard";
        }

        if (elements.bottomLoginAction) {
            elements.bottomLoginAction.href =
                "login.html";

            elements.bottomLoginAction.textContent =
                "Switch account";
        }
    }

    function initialiseRevealAnimations() {
        if (
            reducedMotionQuery.matches ||
            !("IntersectionObserver" in window)
        ) {
            elements.revealElements.forEach(
                (element) => {
                    element.classList.add(
                        "is-visible"
                    );
                }
            );

            return;
        }

        const observer =
            new IntersectionObserver(
                (entries, currentObserver) => {
                    entries.forEach((entry) => {
                        if (!entry.isIntersecting) {
                            return;
                        }

                        entry.target.classList.add(
                            "is-visible"
                        );

                        currentObserver.unobserve(
                            entry.target
                        );
                    });
                },
                {
                    threshold: 0.14,
                    rootMargin:
                        "0px 0px -40px 0px"
                }
            );

        elements.revealElements.forEach(
            (element, index) => {
                element.style.transitionDelay =
                    `${(index % 3) * 0.1}s`;

                observer.observe(element);
            }
        );
    }

    function registerEvents() {
        elements.themeToggle?.addEventListener(
            "click",
            toggleTheme
        );

        elements.menuButton?.addEventListener(
            "click",
            toggleNavigation
        );

        elements.navigationLinks.forEach(
            (link) => {
                link.addEventListener(
                    "click",
                    closeNavigation
                );
            }
        );

        document.addEventListener(
            "click",
            (event) => {
                if (
                    !elements.navigation?.classList.contains(
                        "is-open"
                    )
                ) {
                    return;
                }

                const clickedInsideNavigation =
                    elements.navigation.contains(
                        event.target
                    );

                const clickedMenuButton =
                    elements.menuButton?.contains(
                        event.target
                    );

                if (
                    !clickedInsideNavigation &&
                    !clickedMenuButton
                ) {
                    closeNavigation();
                }
            }
        );

        window.addEventListener(
            "resize",
            () => {
                if (window.innerWidth > 860) {
                    closeNavigation();
                }
            }
        );
    }

    function initialise() {
        initialiseTheme();
        initialiseAccountActions();
        initialiseRevealAnimations();
        registerEvents();

        if (elements.currentYear) {
            elements.currentYear.textContent =
                String(new Date().getFullYear());
        }
    }

    initialise();
})();
