/*
    Generic input validation and sanitization functions.
*/

export function is_alphanumeric(string) {
    return /^[a-z0-9]+$/i.test(string);
}

export function is_between_lengths(string, min, max) {
    return string.length >= min && string.length <= max;
}
