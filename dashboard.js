"use strict";

(() => {
    const STORAGE_KEYS = Object.freeze({
        users: "tokenTroveUsers",
        session: "tokenTroveSession",
        theme: "tokenTroveTheme",
        progressPrefix: "tokenTroveProgress:"
    });

    const TASKS = Object.freeze([
        {
            id: "facebook-follow",
            category: "social",
            title: "Follow the creator on Facebook",
            description: "Open the creator’s Facebook profile and follow the account.",
            reward: 25,
            xp: 120,
            link: "https://www.facebook.com/profile.php?id=61550055038846"
        },
        {
            id: "instagram-follow",
            category: "social",
            title: "Follow the creator on Instagram",
            description: "Visit the creator’s Instagram page and follow the profile.",
            reward: 23,
            xp: 140,
            link: "https://www.instagram.com/boi_nenye?igsh=ZGUzMzM3NWJiOQ=="
        },
        {
            id: "tiktok-follow",
            category: "social",
            title: "Follow the creator on TikTok",
            description: "Open the TikTok page and follow the creator account.",
            reward: 20,
            xp: 110,
            link: "https://www.tiktok.com/@boinenye207"
        },
        {
            id: "facebook-share",
            category: "share",
            title: "Share a post about Token-Trove on Facebook",
            description: "Post about Token-Trove on your Facebook timeline to help spread the word.",
            reward: 48,
            xp: 180,
            link: "https://www.facebook.com"
        },
        {
            id: "facebook-screenshot",
            category: "share",
            title: "Share a screenshot of your dashboard on Facebook",
            description: "Take a screenshot of your dashboard and share it on Facebook while tagging the creator.",
            reward: 37,
            xp: 160,
            link: "https://www.facebook.com"
        },
        {
            id: "facebook-invite",
            category: "invite",
            title: "Invite your Facebook friends to try Token-Trove",
            description: "Send invitations to your Facebook contacts and invite them to test the platform.",
            reward: 60,
            xp: 220,
            link: "https://www.facebook.com"
        },
        {
            id: "instagram-share",
            category: "share",
            title: "Share a post about Token-Trove on Instagram",
            description: "Create an Instagram post or story about Token-Trove and publish it.",
            reward: 48,
            xp: 180,
            link: "https://www.instagram.com"
        },
        {
            id: "instagram-screenshot",
            category: "share",
            title: "Share your dashboard screenshot on Instagram",
            description: "Post your progress screenshot on Instagram and tag the creator profile.",
            reward: 37,
            xp: 160,
            link: "https://www.instagram.com"
        },
        {
            id: "instagram-invite",
            category: "invite",
            title: "Invite your Instagram friends to Token-Trove",
            description: "Invite your Instagram audience or close contacts to explore Token-Trove.",
            reward: 60,
            xp: 220,
            link: "https://www.instagram.com"
        }
    ]);

    const dom = {
        pageLoader: document.getElementById("page-loader"),
        loaderText: document.getElementById("loader-text"),
        toast: document.getElementById("app-toast"),
        themeToggle: document.getElementById("theme-toggle"),
        logoutButton: document.getElementById("logout-button"),
        resetProgressButton: document.getElementById("reset-progress-button"),
        taskSearchInput: document.getElementById("task-search"),
        filterButtons: Array.from(document.querySelectorAll("[data-filter]")),
        tasksContainer: document.getElementById("tasks-container"),
        userName: document.getElementById("userName"),
        accountCopy: document.getElementById("account-copy"),
        balance: document.getElementById("balance"),
        totalEarned: document.getElementById("total-earned"),
        tasksCompleted: document.getElementById("tasks-completed"),
        completedCount: document.getElementById("completed-count"),
        startedCount: document.getElementById("started-count"),
        tasksRemaining: document.getElementById("tasks-remaining"),
        currentThemeText: document.getElementById("current-theme-text"),
        level: document.getElementById("level"),
        xpText: document.getElementById("xp-text"),
        progressFill: document.getElementById("progress-fill"),
        currentYear: document.getElementById("current-year")
    };

    const state = {currentUser: null, progress: null, activeFilter: "all", searchTerm: ""};

    function safeParse(value, fallback) {
        try {
            return JSON.parse(value) || fallback;
        } catch (error) {
            return fallback;
        }
    }

    function formatCurrency(value) {
        return `$${Number(value || 0).toLocaleString()}`;
    }

    function normaliseText(value, maximumLength = 100) {
        return String(value || "").replace(/\s+/g, " ").trim().slice(0, maximumLength);
    }

    function getUsers() {
        const users = safeParse(localStorage.getItem(STORAGE_KEYS.users), []);
        return Array.isArray(users) ? users : [];
    }

    function getSession() {
        return safeParse(localStorage.getItem(STORAGE_KEYS.session), null);
    }

    function getProgressStorageKey() {
        return `${STORAGE_KEYS.progressPrefix}${state.currentUser.id}`;
    }

    function defaultProgress() {
        return {balance: 0, totalEarned: 0, level: 1, currentXp: 0, completedTaskIds: [], startedTaskIds: []};
    }

    function saveProgress() {
        localStorage.setItem(getProgressStorageKey(), JSON.stringify(state.progress));
    }

    function loadProgress() {
        const stored = safeParse(localStorage.getItem(getProgressStorageKey()), defaultProgress());

        return {
            balance: Number(stored.balance) || 0,
            totalEarned: Number(stored.totalEarned) || 0,
            level: Number(stored.level) || 1,
            currentXp: Number(stored.currentXp) || 0,
            completedTaskIds: Array.isArray(stored.completedTaskIds) ? stored.completedTaskIds.filter((item) => typeof item === "string") : [],
            startedTaskIds: Array.isArray(stored.startedTaskIds) ? stored.startedTaskIds.filter((item) => typeof item === "string") : []
        };
    }

    function applyTheme(theme) {
        const safeTheme = theme === "dark" ? "dark" : "light";

        document.documentElement.dataset.theme = safeTheme;

        const icon = dom.themeToggle?.querySelector(".theme-toggle__icon");
        const text = dom.themeToggle?.querySelector(".theme-toggle__text");

        dom.themeToggle?.setAttribute("aria-pressed", String(safeTheme === "dark"));

        if (icon) {
            icon.textContent = safeTheme === "dark" ? "☀" : "☾";
        }

        if (text) {
            text.textContent = safeTheme === "dark" ? "Light mode" : "Dark mode";
        }

        if (dom.currentThemeText) {
            dom.currentThemeText.textContent = safeTheme === "dark" ? "Dark" : "Light";
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

    function showLoader(isVisible, text = "Loading...") {
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

    function getXpGoal(level) {
        return 300 + ((level - 1) * 150);
    }

    function isCompleted(taskId) {
        return state.progress.completedTaskIds.includes(taskId);
    }

    function isStarted(taskId) {
        return state.progress.startedTaskIds.includes(taskId);
    }

    function addStartedTask(taskId) {
        if (!isStarted(taskId)) {
            state.progress.startedTaskIds.push(taskId);
            saveProgress();
        }
    }

    function awardTask(task) {
        if (isCompleted(task.id)) {
            return;
        }

        state.progress.completedTaskIds.push(task.id);

        if (!isStarted(task.id)) {
            state.progress.startedTaskIds.push(task.id);
        }

        state.progress.balance += task.reward;
        state.progress.totalEarned += task.reward;
        state.progress.currentXp += task.xp;

        while (state.progress.currentXp >= getXpGoal(state.progress.level)) {
            state.progress.currentXp -= getXpGoal(state.progress.level);
            state.progress.level += 1;
        }

        saveProgress();
    }

    function getFilteredTasks() {
        return TASKS.filter((task) => {
            const matchesFilter = state.activeFilter === "all" ? true : task.category === state.activeFilter;
            const searchValue = `${task.title} ${task.description} ${task.category}`.toLowerCase();
            const matchesSearch = searchValue.includes(state.searchTerm);
            return matchesFilter && matchesSearch;
        });
    }

    function createTaskCard(task) {
        const card = document.createElement("article");
        card.className = "task-card";
        const status = isCompleted(task.id) ? "completed" : isStarted(task.id) ? "started" : "new";
        const top = document.createElement("div");
        top.className = "task-card__top";

        const badge = document.createElement("span");
        badge.className = "task-badge";
        badge.textContent = task.category;

        const statusEl = document.createElement("span");
        statusEl.className = `task-status task-status--${status}`;
        statusEl.textContent = status === "new" ? "new" : status === "started" ? "in progress" : "completed";
        top.append(badge, statusEl);

        const title = document.createElement("h3");
        title.textContent = task.title;

        const description = document.createElement("p");
        description.textContent = task.description;

        const meta = document.createElement("div");
        meta.className = "task-meta";

        const reward = document.createElement("span");
        reward.textContent = `Reward: ${formatCurrency(task.reward)}`;

        const xp = document.createElement("span");
        xp.textContent = `XP: ${task.xp}`;

        meta.append(reward, xp);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const openButton = document.createElement("button");
        openButton.className = "button button--secondary";
        openButton.type = "button";
        openButton.dataset.action = "open-task";
        openButton.dataset.taskId = task.id;
        openButton.textContent = isCompleted(task.id) ? "View task" : "Start task";

        const claimButton = document.createElement("button");
        claimButton.className = "button button--primary";
        claimButton.type = "button";
        claimButton.dataset.action = "claim-task";
        claimButton.dataset.taskId = task.id;
        claimButton.textContent = isCompleted(task.id) ? "Reward claimed" : "Claim reward";

        if (isCompleted(task.id)) {
            claimButton.disabled = true;
        }

        actions.append(openButton, claimButton);

        card.append(top, title, description, meta, actions);

        return card;
    }

    function renderTasks() {
        if (!dom.tasksContainer) {
            return;
        }

        dom.tasksContainer.innerHTML = "";

        const filteredTasks = getFilteredTasks();

        if (filteredTasks.length === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "empty-state";

            const title = document.createElement("h3");
            title.textContent = "No tasks found";

            const message = document.createElement("p");
            message.textContent = "Try another filter or search term to find available tasks.";

            emptyState.append(title, message);
            dom.tasksContainer.appendChild(emptyState);
            return;
        }

        filteredTasks.forEach((task) => {
            dom.tasksContainer.appendChild(createTaskCard(task));
        });
    }

    function animateNumber(element, value, prefix = "") {
        if (!element) {
            return;
        }

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (reducedMotion) {
            element.textContent = `${prefix}${Number(value).toLocaleString()}`;
            return;
        }

        const duration = 600;
        const startTime = performance.now();
        const startValue = 0;

        function update(currentTime) {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const currentValue = Math.floor(startValue + ((value - startValue) * progress));

            element.textContent = `${prefix}${currentValue.toLocaleString()}`;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    function renderSummary() {
        const completed = state.progress.completedTaskIds.length;
        const started = state.progress.startedTaskIds.length;
        const remaining = TASKS.length - completed;
        const xpGoal = getXpGoal(state.progress.level);
        const xpPercentage = Math.min((state.progress.currentXp / xpGoal) * 100, 100);

        dom.userName.textContent = `Welcome, ${state.currentUser.username}`;
        dom.accountCopy.textContent = `You are signed in as ${state.currentUser.email}. Complete tasks and keep increasing your progress.`;

        dom.balance.textContent = formatCurrency(state.progress.balance);
        dom.totalEarned.textContent = formatCurrency(state.progress.totalEarned);

        dom.tasksCompleted.textContent = `${completed} of ${TASKS.length} tasks completed`;
        dom.completedCount.textContent = String(completed);
        dom.startedCount.textContent = String(started);
        dom.tasksRemaining.textContent = String(remaining);

        dom.level.textContent = `Level ${state.progress.level}`;
        dom.xpText.textContent = `${state.progress.currentXp} / ${xpGoal} XP`;
        dom.progressFill.style.width = `${xpPercentage}%`;

        animateNumber(dom.completedCount, completed);
        animateNumber(dom.startedCount, started);
        animateNumber(dom.tasksRemaining, remaining);

        if (dom.currentYear) {
            dom.currentYear.textContent = String(new Date().getFullYear());
        }
    }

    function updateFilterButtons() {
        dom.filterButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.filter === state.activeFilter);
        });
    }

    function handleOpenTask(taskId) {
        const task = TASKS.find((item) => item.id === taskId);

        if (!task) {
            return;
        }

        addStartedTask(task.id);
        renderSummary();
        renderTasks();

        window.open(task.link, "_blank", "noopener,noreferrer");
        showToast(`Task opened: ${task.title}`, "success");
    }

    function handleClaimTask(taskId) {
        const task = TASKS.find((item) => item.id === taskId);

        if (!task) {
            return;
        }

        if (isCompleted(task.id)) {
            showToast("You already claimed this reward.", "error");
            return;
        }

        if (!isStarted(task.id)) {
            showToast("Start the task first before claiming the reward.", "error");
            return;
        }

        const confirmed = window.confirm(
            `Confirm that you completed "${task.title}" and want to claim ${formatCurrency(task.reward)} and ${task.xp} XP.`
        );

        if (!confirmed) {
            return;
        }

        awardTask(task);
        renderSummary();
        renderTasks();
        showToast(`Reward claimed: ${formatCurrency(task.reward)} and ${task.xp} XP added.`, "success");
    }

    function resetProgress() {
        const confirmed = window.confirm(
            "This will reset your balance, XP, level, started tasks, and completed tasks. Continue?"
        );

        if (!confirmed) {
            return;
        }

        state.progress = defaultProgress();
        saveProgress();
        renderSummary();
        renderTasks();
        showToast("Your progress has been reset.", "success");
    }

    function logout() {
        showLoader(true, "Signing you out...");

        localStorage.removeItem(STORAGE_KEYS.session);

        window.setTimeout(() => {
            window.location.href = "index.html";
        }, 700);
    }

    function registerEvents() {
        dom.logoutButton?.addEventListener("click", logout);
        dom.resetProgressButton?.addEventListener("click", resetProgress);

        dom.taskSearchInput?.addEventListener("input", () => {
            state.searchTerm = normaliseText(dom.taskSearchInput.value, 80).toLowerCase();
            renderTasks();
        });

        dom.filterButtons.forEach((button) => {
            button.addEventListener("click", () => {
                state.activeFilter = button.dataset.filter || "all";
                updateFilterButtons();
                renderTasks();
            });
        });

        dom.tasksContainer?.addEventListener("click", (event) => {
            const trigger = event.target.closest("[data-action]");

            if (!trigger) {
                return;
            }

            const action = trigger.dataset.action;
            const taskId = trigger.dataset.taskId;

            if (action === "open-task") {
                handleOpenTask(taskId);
            }

            if (action === "claim-task") {
                handleClaimTask(taskId);
            }
        });
    }

    function initialiseCurrentUser() {
        const session = getSession();

        if (!session || !session.userId) {
            window.location.href = "index.html";
            return false;
        }

        const users = getUsers();
        const matchedUser = users.find((user) => user.id === session.userId);

        if (!matchedUser) {
            localStorage.removeItem(STORAGE_KEYS.session);
            window.location.href = "index.html";
            return false;
        }

        state.currentUser = matchedUser;
        state.progress = loadProgress();

        return true;
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

    function initialise() {
        showLoader(true, "Preparing your dashboard...");

        if (!initialiseCurrentUser()) {
            return;
        }

        initialiseTheme();
        updateFilterButtons();
        renderSummary();
        renderTasks();
        registerEvents();

        window.setTimeout(() => {
            showLoader(false);
        }, 500);
    }

    initialise();
})();
