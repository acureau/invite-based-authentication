/*
    This source file defines the REST API. It contains all middleware, input validations, and routes.
    Each route has a comment header describing its functionality, inputs, and outputs. Every response 
    contains a status message.
*/

import express from 'express';
import { is_alphanumeric, is_between_lengths } from './validation.js';
import {
    create_session,
    create_user,
    delete_session,
    check_username,
    check_invite_code,
    check_password,
    check_admin,
    create_invite_code,
    delete_user,
    check_session,
} from './auth.js';
export const backend = express();

/*
    ===========
    | HELPERS |
    ===========
*/

// Returns a JSON response body with a message and arbitrary data.
function response_message(response, status, message, data = {}) {
    return response.status(status).json({ message: message, ...data });
}

// Shortcut function for invalid request errors.
function invalid_request_error(res) {
    return response_message(res, 400, 'Invalid request format.');
}

// Shortcut function for server errors.
function server_error(res) {
    return response_message(res, 500, 'Internal server error.');
}

/*
    ==============
    | MIDDLEWARE |
    ==============
*/

// Handles parsing JSON request bodies.
backend.use(express.json());

// Handles validating tokens for authenticated routes.
function auth(req, res, next) {
    try {
        const { auth_token } = req.body;

        // Verify parameters exist.
        if (!auth_token) {
            return invalid_request_error(res);
        }

        // Verify session.
        const username = check_session(auth_token);
        if (!username) {
            return response_message(res, 401, 'Invalid authentication token.');
        }

        req.auth = { username };
        next();
    } catch {
        return server_error(res);
    }
}

// Handles permission checks for administrator-only routes.
function admin(req, res, next) {
    try {
        const { username } = req.auth;

        // Verify admin.
        if (!check_admin(username)) {
            return response_message(res, 403, 'Insufficient permissions.');
        }

        next();
    } catch {
        return server_error(res);
    }
}

/*
    =================================
    | USER AUTHENTICATION ENDPOINTS |
    =================================
*/

/*
    Description: Creates a new user session.
    Permissions: Unauthenticated.
    Request Data: Username and password.
    Response Data: Authentication token.
*/
backend.post('/signin', (req, res) => {
    try {
        const { username, password } = req.body;

        // Verify parameters exist.
        if (!username || !password) {
            return invalid_request_error(res);
        }

        // Verify username exists.
        if (!check_username(username)) {
            return response_message(res, 404, 'Username does not exist.');
        }

        // Check password.
        if (!check_password(username, password)) {
            return response_message(res, 401, 'Incorrect password.');
        }

        // Create session for user account.
        const auth_token = create_session(username);

        // Send response.
        return response_message(res, 200, 'Signed in successfully.', {
            auth_token: auth_token,
        });
    } catch {
        return server_error(res);
    }
});

/*
    Description: Creates a new user account.
    Permissions: Unauthenticated.
    Request Data: Username, password, and invite code.
    Response Data: Authentication token.
*/
backend.post('/signup', (req, res) => {
    try {
        const { username, password, invite_code } = req.body;

        // Verify parameters exist.
        if (!username || !password || !invite_code) {
            return invalid_request_error(res);
        }

        // Validate username parameter.
        if (
            !is_alphanumeric(username) ||
            !is_between_lengths(username, 1, 32)
        ) {
            return response_message(
                res,
                400,
                'Username must be alphanumeric with a maximum length of 32 characters.'
            );
        }

        // Make sure username doesn't already exist.
        if (check_username(username)) {
            return response_message(res, 400, 'Username already exists.');
        }

        // Make sure invite code is valid.
        if (!check_invite_code(invite_code)) {
            return response_message(res, 400, 'Invalid invite code.');
        }

        // Create user account and session.
        create_user(username, password, invite_code);
        const auth_token = create_session(username);

        // Send response.
        return response_message(res, 200, 'Signed up successfully.', {
            auth_token: auth_token,
        });
    } catch {
        return server_error(res);
    }
});

/*
    Description: Deletes an active user session.
    Permissions: Authenticated.
    Request Data: Authentication token.
*/
backend.post('/signout', auth, (req, res) => {
    try {
        const { auth_token } = req.body;

        // Delete session.
        delete_session(auth_token);

        // Send response.
        return response_message(res, 200, 'Signed out successfully.');
    } catch {
        return server_error(res);
    }
});

/*
    ============================
    | ADMINISTRATION ENDPOINTS |
    ============================
*/

/*
    Description: Creates an invite code.
    Permissions: Administrator.
    Request Data: Authentication token.
    Response Data: Invite code.
*/
backend.post('/create-invite-code', auth, admin, (req, res) => {
    try {
        // Create invite code.
        const invite_code = create_invite_code();

        // Send response.
        return response_message(res, 200, 'Created invite code successfully.', {
            invite_code: invite_code,
        });
    } catch {
        return server_error(res);
    }
});

/*
    Description: Deletes a user account.
    Permissions: Administrator.
    Request Data: Authentication token, username of account to delete.
*/
backend.post('/delete-user', auth, admin, (req, res) => {
    try {
        const { username } = req.body;

        // Verify parameters exist.
        if (!username) {
            return invalid_request_error(res);
        }

        // Don't allow deleting admin account.
        if (username == 'admin') {
            return response_message(res, 403, 'Cannot delete admin account.');
        }

        // Verify user exists.
        if (!check_username(username)) {
            return response_message(res, 404, 'User does not exist.');
        }

        // Delete user account.
        delete_user(username);

        // Send response.
        return response_message(res, 200, 'Deleted user successfully.');
    } catch {
        return server_error(res);
    }
});
