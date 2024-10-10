/*
    Back-end entry point.
*/

import { open_database, clean_database } from './database.js';
import { backend } from './api.js';

/*
    GLOBAL CONSTANTS
    todo: put these into environment variables
*/

export const database_path = 'database.db';

/*
    SERVER INITIALIZATION
*/

const backend_port = 3000;
backend.listen(backend_port, () => {
    if (!open_database()) {
        // Exit if can't open database.
        process.exit(1);
    } else {
        // Clean database and schedule daily automatic cleaning.
        clean_database();
        setInterval(clean_database, 24 * 60 * 60 * 1000);
    }
});
