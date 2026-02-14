// Check if user is logged in
function checkLogin() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        // Not logged in, redirect to login
        window.location.href = "/Login/index.html";
    }
}

// Call checkLogin on every protected page
// Only include this script in pages you want protected


// ==============================
// LOGOUT FUNCTION (WITH LOADER)
// ==============================
const logoutBtn = document.getElementById('Logout-button');
const loaderOverlay = document.getElementById('loader-overlay');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {

        if (loaderOverlay) {
            loaderOverlay.style.display = "flex";
        }

        setTimeout(() => {
            localStorage.removeItem('username');
            window.location.href = 'index.html';
        }, 1200);
    });
}


// ==============================
// DARK MODE (PERSIST)
// ==============================
const darkBtn = document.getElementById('darkmode');
const body = document.body;

function updateDarkModeUI() {
    if (!darkBtn) return;

    const isDark = body.classList.contains('dark');
    darkBtn.textContent = isDark ? 'Lightmode' : 'Darkmode';
}

if (darkBtn) {
    darkBtn.addEventListener('click', () => {
        body.classList.toggle('dark');
        localStorage.setItem('darkmode', body.classList.contains('dark'));
        updateDarkModeUI();
    });
}

// TASKS (RESETS EVERY REFRESH)
const defaultTasks = [
    { title: "Follow creator on facebook", link: 'https://www.facebook.com/profile.php?id=61550055038846', completed: false, reward: 25, xp: 150 },
    { title: "Follow creator on instagram", link: 'https://www.instagram.com/boi_nenye?igsh=ZGUzMzM3NWJiOQ==', completed: false, reward: 23, xp: 200 },
    { title: "Follow creator on tiktok", link: 'https://www.tiktok.com/@boinenye207', completed: false, reward: 20, xp: 150 },

    { title: "Share a post on facebook about Token-Trove", link: 'https://www.facebook.com', completed: false, reward: 48, xp: 150 },
    { title: "Screenshot-share your dashboard on facebook and tag creator", link: 'https://www.facebook.com', completed: false, reward: 37, xp: 150 },
    { title: "Invite facebook friends to try Token-Trove", link: 'https://www.facebook.com', completed: false, reward: 60, xp: 150 },
    
    { title: "Share a post on instagram about Token-Trove", link: 'https://www.instagram.com', completed: false, reward: 48, xp: 150 },
    { title: "Screenshot-share your dashboard on instagram and tag creator", link: 'https://www.instagram.com', completed: false, reward: 37, xp: 150 },
    { title: "Invite instagram friends to try Token-Trove", link: 'https://www.instagram.com', completed: false, reward: 60, xp: 150 },
];

let tasks = JSON.parse(JSON.stringify(defaultTasks));
let balance = 0;
let xp = 0;
let level = 2;
let xpNeeded = 500;


// ==============================
// DOM ELEMENTS
// ==============================
const balanceEl = document.getElementById('balance');
const tasksContainer = document.getElementById('tasks-container');
const taskCompletedEl = document.getElementById('tasks-completed');
const userNameEl = document.getElementById('userName');
const progressFill = document.getElementById('progress-fill');
const xpText = document.getElementById('xp-text');
const levelEl = document.getElementById('level');


// ==============================
// MONEY ANIMATION
// ==============================
function animateBalance(newAmount) {

    if (!balanceEl) return;

    let start = balance;
    let end = newAmount;
    let duration = 1000;
    let startTime = null;

    function animate(time) {
        if (!startTime) startTime = time;

        let progress = time - startTime;
        let percent = Math.min(progress / duration, 1);

        let current = Math.floor(start + (end - start) * percent);
        balanceEl.textContent = `$${current.toLocaleString()}`;

        if (percent < 1) {
            requestAnimationFrame(animate);
        } else {
            balance = newAmount;
        }
    }

    requestAnimationFrame(animate);
}


// ==============================
// XP SYSTEM
// ==============================
function addXP(amount) {
    xp += amount;

    if (xp >= xpNeeded) {
        xp -= xpNeeded;
        level++;
        xpNeeded += 200; // increases difficulty
    }

    updateXPUI();
}

function updateXPUI() {

    if (!progressFill || !xpText || !levelEl) return;

    const percent = (xp / xpNeeded) * 100;

    progressFill.style.width = percent + "%";
    xpText.textContent = `${xp} / ${xpNeeded} XP`;
    levelEl.textContent = `Level ${level}:` + `  `;
}


// ==============================
// BALANCE SYSTEM
// ==============================
function updateBalance() {
    if (!balanceEl) return;
    balanceEl.textContent = `$${balance.toLocaleString()}`;
}


// ==============================
// COMPLETED COUNTER
// ==============================
function updateCompletedCount() {
    if (!taskCompletedEl) return;

    const completedCount = tasks.filter(task => task.completed).length;

    taskCompletedEl.textContent =
        `${completedCount} task${completedCount !== 1 ? 's' : ''} completed`;
}


//RENDER TASKS
function renderTasks() {
    if (!tasksContainer) return;

    tasksContainer.innerHTML = '';

    tasks.forEach((task, index) => {

        const card = document.createElement('div');
        card.className = 'task-card';

        const title = document.createElement('p');
        title.style.textAlign = 'center';
        title.className = 'task-title';
        title.textContent = task.title;

        const button = document.createElement('button');
        button.className = 'task-done';

        if (task.completed) {
            button.textContent = 'Completed';
            button.disabled = true;
        } else {
            button.textContent = `Redeem $${task.reward}`;
        }

        button.addEventListener('click', () => {

            if (tasks[index].completed) return;

            if (task.link) {
                window.open(task.link);
            }

            button.disabled = true;
            button.textContent = 'Verifying...';

            setTimeout(() => {

                const didComplete = confirm("Did you complete this task?");

                if (didComplete) {
                    tasks[index].completed = true;

                    if (typeof balance !== "undefined") {
                        animateBalance(balance + task.reward);
                    }

                    if (typeof addXP === "function") {
                        addXP(task.xp);
                    }

                    if (typeof updateCompletedCount === "function") {
                        updateCompletedCount();
                    }
                }

                renderTasks();

            }, 30000);
        });


        card.appendChild(title);
        card.appendChild(button);
        tasksContainer.appendChild(card);
    });
}



// ==============================
// INITIAL LOAD (GAME RESET)
// ==============================
document.addEventListener('DOMContentLoaded', () => {

    // Reset everything
    balance = 0;
    xp = 0;
    level = 1;
    xpNeeded = 500;
    tasks = JSON.parse(JSON.stringify(defaultTasks));

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkmode') === 'true';
    if (savedDarkMode) body.classList.add('dark');

    updateDarkModeUI();

    // Load username safely
    const getUserName = JSON.parse(localStorage.getItem('userData'));
    if (getUserName && getUserName.userName && userNameEl) {
        userNameEl.textContent = `Welcome, ${getUserName.userName}`;
    }

    updateBalance();
    updateXPUI();
    renderTasks();
    updateCompletedCount();
});
