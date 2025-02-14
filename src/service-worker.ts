/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'watchlist-cache-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', ((event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        '/',
        '/index.html',
        '/manifest.json',
        '/favicon.ico',
      ]);
    })
  );
}) as EventListener);

self.addEventListener('fetch', ((event: FetchEvent) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => 
        caches.open(CACHE_NAME)
          .then(cache => cache.match(OFFLINE_URL))
          .then(response => response || new Response('Offline page not found', { status: 404 }))
      )
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
}) as EventListener); 