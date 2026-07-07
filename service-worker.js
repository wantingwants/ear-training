// 版本號改變時，會觸發快取更新
// ⚠️ 重要：每次修改 index.html / manifest.json 等檔案後，
// 都要把下面這個版本號 +1，才會強制手機端重新抓取新檔案
const CACHE_NAME = "pitch-ear-v2";

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// 安裝階段：把所有必要檔案抓下來存進本地快取
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// 啟用階段：清掉舊版本的快取
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 攔截網路請求
self.addEventListener("fetch", (event) => {
  // 網頁本身 (HTML)：優先問網路，確保拿到最新版本
  // 只有在離線抓不到網路時，才退回用本地快取
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 其他資源 (圖示等)：快取優先，減少不必要的網路請求
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});
