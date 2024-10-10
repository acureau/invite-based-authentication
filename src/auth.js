/*
    User authentication functionality.
*/

import { hashSync, compareSync } from 'bcrypt';
import { execute, get_row, log } from './database.js';
import { randomBytes } from 'crypto';

/*
    DATABASE READ-ONLY METHODS
*/

export function check_username(username) {
    return get_row('SELECT * FROM users WHERE username = ?', [username]) != null;
}

export function check_password(username, password) {
    const user_info = get_row('SELECT * FROM users WHERE username = ?', [username]);
    if (!compareSync(password, user_info.password)) {
        return false;
    }
    return true;
}

export function get_username(auth_token) {
    return get_row('SELECT * FROM sessions WHERE auth_token = ?', [auth_token]).username;
}

export function check_admin(username) {
    return get_row('SELECT * FROM users WHERE username = ?', [username]).is_admin == 1;
}

export function check_invite_code(invite_code) {
    return get_row('SELECT * FROM invites WHERE invite_code = ?', [invite_code]) != null;
}

/*
    DATABASE WRITING METHODS
*/

export function create_user(username, password, invite_code) {
    // Hash password.
    const password_hash = hashSync(password, 12);

    // Delete invite code.
    execute('DELETE FROM invites WHERE invite_code = ?', [invite_code]);

    // Add user to database.
    execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, password_hash]);

    // Log action.
    log(`Created new user '${username}', used invite code '${invite_code}'.`);
}

export function delete_user(username) {
    // Delete user.
    execute('DELETE FROM users WHERE username = ?', [username]);

    // Log action.
    log(`Deleted user '${username}'.`);
}

export function create_session(username) {
    // Generate and insert auth token.
    const auth_token = randomBytes(32).toString('hex');
    execute('INSERT INTO sessions (username, auth_token) VALUES (?, ?)', [username, auth_token]);

    // Log action.
    log(`Created new session for '${username}'.`);

    // Return auth token.
    return auth_token;
}

export function check_session(auth_token) {
    const session_info = get_row('SELECT username FROM sessions WHERE auth_token = ?', [auth_token]);
    if (session_info) {
        execute('UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE auth_token = ?', [auth_token]);
        return session_info.username;
    }
    return null;
}

export function delete_session(auth_token) {
    // Get username from session.
    const username = get_username(auth_token);

    // Delete session.
    execute('DELETE FROM sessions WHERE auth_token = ?', [auth_token]);

    // Log action.
    log(`Deleted session for '${username}'.`);
}

export function create_invite_code() {
    // Generate and insert invite code.
    const invite_code = randomBytes(3).toString('hex');
    execute('INSERT INTO invites (invite_code) VALUES (?)', [invite_code]);

    // Log action.
    log(`Created new invite code '${invite_code}'.`);

    // Return invite code.
    return invite_code;
}
