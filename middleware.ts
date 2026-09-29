import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // Supported locales — add more here when ready
  locales: ['en', 'sw'],
  defaultLocale: 'en',
  // Don't prefix the default locale (e.g. /portal not /en/portal)
  localePrefix: 'as-needed',
  // We're i18n-ready but not i18n-mandatory yet:
  // all existing routes stay at their current paths with English.
  // When Kiswahili is fully tested, flip to localePrefix: 'always'.
});

export const config = {
  // Only run on app routes — skip API, static files, and _next
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
