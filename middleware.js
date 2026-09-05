// Turner Page — site-wide Basic Auth gate (pre-launch)
//
// Blocks EVERY request to the domain until the visitor enters the correct
// username/password. Runs at Vercel's Edge, before any HTML, CSS, JS, or
// asset is served — nothing leaks to an unauthenticated visitor.
//
// SETUP:
// 1. Place this file at the REPO ROOT (same level as vercel.json), not
//    inside /shared or any subfolder. Vercel only looks for middleware.js
//    (or .ts) at the root.
// 2. In the Vercel dashboard: Project → Settings → Environment Variables,
//    add SITE_USERNAME and SITE_PASSWORD (any values you like). Do NOT
//    hardcode them here or commit them to the repo.
// 3. Redeploy. Every page now prompts for credentials before loading.
//
// LATER, when you're ready to make marketing pages public again:
// - Add their paths to the `publicPaths` list below, or
// - Delete this file entirely once real per-user login/payment is live.

export const config = {
  // Runs on every request except Vercel's own internal assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export default function middleware(request) {
  const url = new URL(request.url);

  // --- Public paths (marketing pages), edit this list when you're ready ---
  // e.g. ['/', '/index.html', '/home.html', '/enrol.html']
  const publicPaths = [];
  if (publicPaths.includes(url.pathname)) {
    return; // let the request through untouched
  }
  // -------------------------------------------------------------------

  const expectedUser = process.env.SITE_USERNAME;
  const expectedPass = process.env.SITE_PASSWORD;

  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = atob(encoded); // "username:password"
      const sepIndex = decoded.indexOf(':');
      const user = decoded.slice(0, sepIndex);
      const pass = decoded.slice(sepIndex + 1);

      if (user === expectedUser && pass === expectedPass) {
        return; // credentials correct — let the request through
      }
    }
  }

  // No or wrong credentials — prompt the browser's native login dialog.
  return new Response('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Turner Page"',
    },
  });
}
