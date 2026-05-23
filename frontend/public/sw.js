/**
 * Connected Arena — Service Worker
 * Handles background push notifications.
 * Registered by useNotifications.js on mount.
 */

const CACHE_NAME = "arena-v1";

// ── Install / activate ───────────────────────────────────────────────────────
self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", e  => e.waitUntil(self.clients.claim()));

// ── Push event (from Web Push API) ──────────────────────────────────────────
self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { title: "Connected Arena", body: event.data?.text() || "" };
  }

  const title   = data.title   || "Connected Arena";
  const options = {
    body:    data.body  || "",
    icon:    data.icon  || "/favicon.ico",
    badge:   "/favicon.ico",
    tag:     data.tag   || "arena-push",
    renotify: true,
    data:    { url: data.url || "/" },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
