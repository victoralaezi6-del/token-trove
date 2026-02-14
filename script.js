//LOGIN PROGRAM
document.getElementById('Login-button').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    //Get stored user data
    const storedUserData = JSON.parse(localStorage.getItem('userData'));

    //Check credentials
    if (storedUserData.userName === username && storedUserData.password === password){
        alert ('Login successful');
        //Redirect to dashboard page
        window.location.href = 'dashboard.html';
    } else {
        alert ('Invalid credentials');
    }
});