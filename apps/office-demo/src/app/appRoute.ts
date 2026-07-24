export const operationsRoutes = ['/ops', '/ops/dispatch', '/ops/people', '/ops/artifacts', '/ops/events', '/ops/system'] as const;

export type AppRoute = '/office' | typeof operationsRoutes[number] | 'not-found';

export function routeForPathname(pathname: string, operationsConsoleEnabled: boolean): AppRoute {
  if (pathname === '/' || pathname === '/office') return '/office';
  if (operationsRoutes.includes(pathname as typeof operationsRoutes[number])) return operationsConsoleEnabled ? pathname as typeof operationsRoutes[number] : 'not-found';
  return 'not-found';
}

export function navigate(to: string) {
  if (window.location.pathname === to) return;
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
