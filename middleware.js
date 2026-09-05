// Turner Page — site-wide Basic Auth gate (multi-user version)
//
// Same idea as before (blocks every request until correct credentials are
// entered), but now supports MULTIPLE separate username/password pairs —
// so you can give a tester their own login and revoke just theirs later,
// without changing anyone else's password.
//
// SETUP:
// 1. This file replaces the old single-user middleware.js. Same location:
//    repo root, alongside vercel.json.
// 2. In Vercel: Project → Settings → Environments → Production, add ONE
//    environment variable called SITE_USERS. Its value is a list of
//    "username:password" pairs, one per line, e.g.:
//
//      david:correcthorsebattery
//      chetan:anotherpassword123
//      tester1:guineapig2026
//
//    (Vercel's value box accepts multiple lines — just press Enter between
//    pairs.) Do not use a colon or comma inside a username or password
//    itself, since colons separate username from password on each line.
//
// 3. Redeploy (Vercel will prompt you after saving the variable).
//
// ADDING a new person (e.g. a course tester):
//   Edit the SITE_USERS variable, add a new line for them, save, redeploy.
//
// REMOVING someone's access:
//   Delete their line from SITE_USERS, save, redeploy. Nobody else's
//   login is affected.
//
// BACKWARD COMPATIBILITY:
//   If SITE_USERS isn't set yet, this falls back to the old single-pair
//   SITE_USERNAME / SITE_PASSWORD variables, so nothing breaks if you
//   haven't migrated yet. Once SITE_USERS is set, it takes priority.

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

function loadValidUsers() {
  const raw = process.env.SITE_USERS;
  const users = new Map();

  if (raw) {
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue; // skip blank lines
      const sepIndex = trimmed.indexOf(':');
      if (sepIndex === -1) continue; // skip malformed lines
      const user = trimmed.slice(0, sepIndex).trim();
      const pass = trimmed.slice(sepIndex + 1).trim();
      if (user && pass) users.set(user, pass);
    }
  }

  // Backward-compatible fallback to the old single-pair variables.
  if (users.size === 0 && process.env.SITE_USERNAME && process.env.SITE_PASSWORD) {
    users.set(process.env.SITE_USERNAME, process.env.SITE_PASSWORD);
  }

  return users;
}

export default function middleware(request) {
  const url = new URL(request.url);

  // --- Public paths (marketing pages), edit this list when you're ready ---
  const publicPaths = [];
  if (publicPaths.includes(url.pathname)) {
    return;
  }
  // -------------------------------------------------------------------

  const validUsers = loadValidUsers();
  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded); // "username:password"
      const sepIndex = decoded.indexOf(':');
      const user = decoded.slice(0, sepIndex);
      const pass = decoded.slice(sepIndex + 1);

      if (validUsers.has(user) && validUsers.get(user) === pass) {
        return; // correct credentials for this user — let them through
      }
    }
  }

  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Turner Page"',
    },
  });
}
