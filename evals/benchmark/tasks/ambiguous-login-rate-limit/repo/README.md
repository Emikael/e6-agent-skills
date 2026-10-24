# Auth service

`POST /login` with JSON `{ "username": "...", "password": "..." }` returns 200 or 401.
Run checks with `node --test`; run locally with `PORT=0 node server.js`.
