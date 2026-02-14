//SIGN-UP PROGRAM
document.getElementById('sign-up-button').addEventListener('click', () => {
    const userName = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    //Simple Validation
    if (userName === '' || email === '' || password === '' || confirmPassword === '') {
        alert('Please fill in all fields');
    } else if (password !== confirmPassword) {
        alert('Passwords do not match');
    } else {
        //Store user data in local storage
        const userData = {
            userName,
            email,
            password
        };

        localStorage.setItem('userData', JSON.stringify(userData));
        alert ('Sign-up successful');
        //Redirect to login page
        window.location.href = 'index.html';
    }

});