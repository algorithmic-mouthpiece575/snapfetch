# Cookies & secrets

This folder is **git-ignored** (see `.gitignore`). It holds yt-dlp cookie files,
required for platforms that demand a logged-in session (Instagram, sometimes X).

## Configuring Instagram cookies (dedicated account)

1. Create a **dedicated Instagram account** for the site (not your personal one).
2. Log in to that account in a browser (ideally a **separate profile**).
3. Export the cookies in **Netscape format** with an extension:
   - Firefox/Chrome: "**Get cookies.txt LOCALLY**" (open-source).
   - On the `https://www.instagram.com` page (logged in), export → `cookies.txt`.
4. Place the file here, for example:
   `server/secrets/instagram.cookies.txt`
5. Set the path in `server/.env`:
   ```
   YTDLP_COOKIES_FILE=./secrets/instagram.cookies.txt
   ```
6. Restart the server.

## Important

- The cookies file **grants access to the account**: keep it private (`chmod 600`).
- **Do not log out** of that account in the browser: it invalidates the exported
  cookies.
- Cookies **expire** (weeks to months) → you'll need to re-export them.
- Instagram may rate-limit/ban an account used heavily: use a throwaway account
  and expect to renew it occasionally.
