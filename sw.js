// Notification worker only: personal pages and records are never cached here.
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let message;
  try { message = event.data?.json(); } catch { message = null; }
  const value = message && typeof message === 'object' ? message : {};
  const url = notificationUrl(value.url);
  event.waitUntil(self.registration.showNotification('OneDay · 待辦提醒', {
    body: typeof value.body === 'string' ? value.body.slice(0, 180) : '有一筆待辦需要你的留意。',
    icon: '/oneday-logo.webp',
    badge: '/favicon.svg',
    tag: typeof value.tag === 'string' ? value.tag.slice(0, 160) : 'oneday-reminder',
    data: { url },
  }));
});
function notificationUrl(value) {
  try {
    const url = new URL(value, self.location.origin);
    if (url.origin === self.location.origin && url.pathname === '/app/plans') return url.href;
  } catch { /* Use the private plans page for unrecognised payloads. */ }
  return new URL('/app/plans', self.location.origin).href;
}
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = notificationUrl(event.notification.data?.url);
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = windows.find(item => new URL(item.url).origin === self.location.origin);
    if (client) {
      const navigated = await client.navigate(url);
      if (navigated) return navigated.focus();
    }
    return self.clients.openWindow(url);
  })());
});
