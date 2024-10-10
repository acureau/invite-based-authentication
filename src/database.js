/*
    Interface to the database.
*/

import fs from 'fs';
import Database from 'better-sqlite3';
import { database_path } from './server.js';

/*
    INITIALIZATION
*/

let db;

function create_tables() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            is_admin BOOLEAN NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sessions (
            auth_token TEXT NOT NULL,
            username TEXT NOT NULL,
            last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS invites (
            invite_code TEXT,
            expiration DATETIME DEFAULT (DATETIME(CURRENT_TIMESTAMP, '+7 days'))
        );

        CREATE TABLE IF NOT EXISTS logs (
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

function create_admin_account() {
    execute(
        `
        INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)    
    `,
        ['admin', 'DEFAULT PASSWORD HASH', 1]
    );
}

export function open_database() {
    try {
        const db_already_exists = fs.existsSync(database_path);
        db = new Database(database_path);

        if (!db_already_exists) {
            create_tables();
            create_admin_account();
        }

        return true;
    } catch {
        return false;
    }
}

/*
    DATABASE INSTANCE WRAPPERS
*/

export function execute(query, params = []) {
    if (db != null) {
        db.prepare(query).run(params);
    }
}

export function get_row(query, params = []) {
    if (db != null) {
        return db.prepare(query).get(params) || null;
    }
}

export function get_rows(query, params = []) {
    if (db != null) {
        return db.prepare(query).all(params) || null;
    }
}

/*
    GLOBAL DATABASE FUNCTIONALITY
*/

export function clean_database() {
    const current_time = new Date().toISOString();
    execute('DELETE FROM invites WHERE expiration < ?', [current_time]);
    execute("DELETE FROM sessions WHERE last_active < DATETIME(?, '-30 days')", [current_time]);
    execute("DELETE FROM logs WHERE timestamp < DATETIME(?, '-30 days')", [current_time]);
}

export function log(message) {
    if (message != null) {
        execute('INSERT INTO logs (message) VALUES (?)', [message]);
    }
}
