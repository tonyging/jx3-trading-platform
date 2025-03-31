// public/sw.js
self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || '劍三交易平台';
    const options = {
        body: data.content || '您有一則新通知',
        icon: '/favicon.ico',
        badge: '/notification-badge.png',
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});