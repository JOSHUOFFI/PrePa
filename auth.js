// auth.js - Authentication utilities for PrePa CBT Portal
// Handles signup, login, access control, and localStorage persistence

// Utility functions
function sanitizeInput(input) {
    return input.trim().replace(/[<>]/g, ''); // Basic sanitization
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    // At least 6 characters
    return password && password.length >= 6;
}

// Simple password hashing (not cryptographically secure, for demo purposes only)
// In production, use proper backend authentication with bcrypt or similar
function hashPassword(password) {
    let hash = 0;
    if (password.length === 0) return hash.toString();
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

function showMessage(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    }
}

// Get all registered users from localStorage
function getAllUsers() {
    try {
        const users = localStorage.getItem('allUsers');
        return users ? JSON.parse(users) : {};
    } catch (error) {
        console.error('Error parsing users:', error);
        return {};
    }
}

// Save all users to localStorage
function saveAllUsers(users) {
    localStorage.setItem('allUsers', JSON.stringify(users));
}

// Get current logged-in user
function getUserData() {
    try {
        const data = localStorage.getItem('userData');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

// Set current logged-in user
function setUserData(data) {
    localStorage.setItem('userData', JSON.stringify(data));
}

// Check if user is logged in
function isLoggedIn() {
    const userData = getUserData();
    return userData && userData.email;
}

// Logout current user
function logout() {
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}

// Configuration
const FORMSPREE_URL = 'https://formspree.io/f/xdapblez'; // Formspree endpoint for signup tracking

// Formspree submission function
async function submitToFormspree(name, email) {
    try {
        const response = await fetch(FORMSPREE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                email: email
            })
        });

        if (response.ok) {
            console.log('Formspree submission successful');
            return true;
        } else {
            console.error('Formspree submission failed with status:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Network error submitting to Formspree:', error);
        return false;
    }
}

// Signup functionality
async function handleSignup(event) {
    event.preventDefault();

    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Signing up...';

    try {
        const name = sanitizeInput(document.getElementById('name').value);
        const email = sanitizeInput(document.getElementById('email').value);
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const terms = document.getElementById('terms').checked;

        // Validation
        if (!name || !email || !password || !confirmPassword || !terms) {
            showMessage('message', 'Please fill in all fields and agree to the terms.', 'danger');
            return;
        }

        if (!isValidEmail(email)) {
            showMessage('message', 'Please enter a valid email address.', 'danger');
            return;
        }

        if (!isValidPassword(password)) {
            showMessage('message', 'Password must be at least 6 characters long.', 'danger');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('message', 'Passwords do not match.', 'danger');
            return;
        }

        // Check if user already exists
        const allUsers = getAllUsers();
        if (allUsers[email]) {
            showMessage('message', 'This email is already registered. Please log in instead.', 'warning');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        // Submit to Formspree for tracking
        const formspreeSuccess = await submitToFormspree(name, email);
        if (!formspreeSuccess) {
            console.warn('Formspree submission failed, but proceeding with local signup');
            // Still proceed with signup, but could show a warning
        }

        // Create new user locally
        const hashedPassword = hashPassword(password);
        allUsers[email] = {
            name: name,
            email: email,
            passwordHash: hashedPassword,
            signupDate: new Date().toISOString()
        };

        // Save all users
        saveAllUsers(allUsers);

        // Log the user in
        setUserData({
            name: name,
            email: email,
            signedUp: true,
            signupDate: new Date().toISOString()
        });

        showMessage('message', 'Signup successful! Welcome to PrePa CBT.', 'success');
        setTimeout(() => window.location.href = 'index.html', 2000);

    } catch (error) {
        console.error('Signup error:', error);
        showMessage('message', 'Signup failed. Please try again later.', 'danger');
    } finally {
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

// Login functionality
function handleLogin(event) {
    event.preventDefault();

    const email = sanitizeInput(document.getElementById('email').value);
    const password = document.getElementById('password').value;

    if (!email || !isValidEmail(email)) {
        showMessage('message', 'Please enter a valid email address.', 'danger');
        return;
    }

    if (!password) {
        showMessage('message', 'Please enter your password.', 'danger');
        return;
    }

    const allUsers = getAllUsers();
    const user = allUsers[email];

    if (!user) {
        showMessage('message', 'Email not found. Please sign up first.', 'warning');
        setTimeout(() => window.location.href = 'signup.html', 2000);
        return;
    }

    // Verify password
    const hashedPassword = hashPassword(password);
    if (user.passwordHash !== hashedPassword) {
        showMessage('message', 'Incorrect password. Please try again.', 'danger');
        return;
    }

    // Log the user in
    setUserData({
        name: user.name,
        email: user.email,
        signedUp: true,
        loginDate: new Date().toISOString()
    });

    showMessage('message', `Welcome back, ${user.name}!`, 'success');
    setTimeout(() => window.location.href = 'index.html', 2000);
}

// Check access for protected pages
function checkAccess() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

// Initialize forms
document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Check if already logged in on signup/login pages and redirect
    if ((window.location.pathname.includes('signup.html') || window.location.pathname.includes('login.html')) && isLoggedIn()) {
        const userData = getUserData();
        showMessage('message', `You are already logged in as ${userData.name}. Redirecting...`, 'info');
        setTimeout(() => window.location.href = 'index.html', 2000);
    }
});