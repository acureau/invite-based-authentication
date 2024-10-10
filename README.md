# Features
 - User registration w/ consumable invite codes.
 - Admin accounts with privleges to generate new invite codes.
 - Expiring session tokens.
 - Database logging.
 - Scheduled database housekeeping.

# Project Summary
This is an authentication system I'm using for a personal website, I built it so that I could generate and distribute invite codes for users to register an account. It's sub-optimal in many ways, the biggest being that it's entirely synchronous, but it's suitable for private services.

It's written in JavaScript using Node and Express, both which I'm very inexperienced with, so bear with me. If you want to use this in your own projects you'll probably need to re-write `database.js` to interface with your database service and structure. By default I'm using a purpose-made SQLite database, if you want to continue to do so make sure to set the bcrypt password hash of the admin account in `database.js`'s `create_admin_account()` function. You can find the user creation logic in `auth.js`'s `create_user()` method for reference.

I've tried my best to keep things clean and organized. I'll review any PRs, but this project is intended to be used as reference and will not often (if ever) be updated.