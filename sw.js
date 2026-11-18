// Простой Service Worker для прохождения проверки PWA
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Ничего не кэшируем жестко, просто пропускаем запросы
});