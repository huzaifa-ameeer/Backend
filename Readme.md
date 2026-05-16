# Authentication in Node.js, Express, and MongoDB

Welcome to the guide on implementing user authentication! Authentication is the process of verifying who a user is, while authorization determines what they are allowed to do. 

This guide uses the most common and secure stack for Node.js apps: **Express**, **MongoDB** (via Mongoose), **bcrypt** (for password hashing), and **JSON Web Tokens (JWT)** (for session management).

## Table of Contents
1. [Key Concepts](#key-concepts)
2. [Prerequisites & Setup](#prerequisites--setup)
3. [Step 1: The User Model](#step-1-the-user-model)
4. [Step 2: User Registration](#step-2-user-registration)
5. [Step 3: User Login](#step-3-user-login)
6. [Step 4: Protecting Routes (Middleware)](#step-4-protecting-routes-middleware)
7. [Best Practices](#best-practices)

---

## Key Concepts

- **Hashing**: We never save plain-text passwords in the database. Instead, we use **bcrypt** to convert passwords into an irreversible, randomized string (a "hash"). 
- **JSON Web Tokens (JWT)**: A secure, URL-safe token that encodes user data. After logging in, the server gives the client a JWT. The client sends this token with future requests to prove their identity.
- **Middleware**: Functions in Express that run between the incoming request and the final route response. We use an authentication middleware to intercept requests and verify the JWT.

---

## Prerequisites & Setup

Before you start writing code, you will need to install a few packages:

```bash
npm install mongoose bcrypt jsonwebtoken dotenv
```

*Make sure to set up your `.env` file with a secret key for JWT:*
```env
JWT_SECRET=your_super_secret_key_here
MONGO_URI=mongodb://localhost:27017/your_db_name
```

---

## Step 1: The User Model

First, we create a Mongoose schema to structure our user documents. We also add a `pre` save hook to automatically hash the user's password before it is saved to MongoDB.

```javascript
// models/user.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Hash the password before saving
userSchema.pre('save', async function (next) {
    // Only hash if the password was modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('User', userSchema);
```

---

## Step 2: User Registration

When a user registers, we take their details, ensure the email isn't already taken, and save them. The model's `pre` save hook automatically hashes their password.

```javascript
// controllers/auth.controller.js
const User = require('../models/user.model');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists." });
        }
        
        // Create and save new user
        const newUser = new User({ username, email, password });
        await newUser.save();
        
        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};
```

---

## Step 3: User Login

During login, we find the user by email, compare the provided password against the hashed password using bcrypt, and generate a JWT if they match.

```javascript
// controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }
        
        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }
        
        // Generate JWT
        const token = jwt.sign(
            { id: user._id, username: user.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } // Token expires in 1 hour
        );
        
        res.status(200).json({ message: "Logged in successfully!", token });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};
```

---

## Step 4: Protecting Routes (Middleware)

Now we create middleware to protect endpoints so that only authenticated users can access them.

```javascript
// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Get token from headers (typically format is "Bearer <token>")
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }
    
    const token = authHeader.split(' ');
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to the request object
        next(); // Proceed to the next middleware or route
    } catch (error) {
        res.status(403).json({ message: "Invalid or expired token." });
    }
};
```

**Usage in a Route:**
```javascript
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');

// Only logged-in users with a valid token can hit this route
router.get('/profile', verifyToken, (req, res) => {
    res.json({ message: `Welcome to your profile, ${req.user.username}!` });
});
```

---

## Best Practices
1. **Never Hardcode Secrets**: Always use `.env` to store sensitive data like `JWT_SECRET` and database URIs.
2. **Use HTTPS**: Passwords and tokens should only be transmitted over secure connections.
3. **Short Token Expiration**: Give your JWTs a short expiration time (e.g., `1h` or `15m`) and consider implementing refresh tokens.
4. **Cookie Storage**: Instead of storing the JWT in `localStorage` on the frontend, consider returning the token in an `HttpOnly` cookie for better protection against Cross-Site Scripting (XSS) attacks.