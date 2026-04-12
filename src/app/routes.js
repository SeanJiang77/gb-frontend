export const ROUTES = {
  landing: "/",
  app: "/app",
  notFound: "/404",
};

export function normalizeRoute(pathname) {
  if (!pathname || pathname === "/") return ROUTES.landing;
  if (pathname === ROUTES.app || pathname.startsWith(`${ROUTES.app}/`)) return ROUTES.app;
  if (pathname === ROUTES.notFound) return ROUTES.notFound;
  return ROUTES.notFound;
}
