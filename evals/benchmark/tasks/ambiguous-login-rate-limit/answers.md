# Answer key (for the simulated user)

Reveal an item only when the agent asks about it (or proposes something that contradicts it).

- Limit: 5 failed login attempts per (client IP, username) pair within a rolling 15-minute window.
- Client IP: `req.socket.remoteAddress`. Ignore `X-Forwarded-For`.
- While limited, every request for that pair gets HTTP 429 with error code `RATE_LIMITED`, even
  with the correct password, and the password is not checked.
- Include a `Retry-After` header: whole seconds until the oldest counted failure leaves the window.
- Requests rejected with 429 do not count as failures.
- A successful login clears the failure history for that pair.
- Other usernames from the same IP are not affected.
- Unknown usernames are counted the same way as known ones.
- In-memory storage is fine; no persistence, no CAPTCHA, no email alerts.
