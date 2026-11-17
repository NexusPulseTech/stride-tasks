/*
 * Video demo trên trang đích (A16). Ảnh bìa (poster) chỉ tải sau khi trang tải xong và video sắp vào màn hình,
 * để không tranh băng thông với ảnh hero (phần tử LCP). Đo trên production 2026-11-18, điện thoại, 4G chậm:
 * gắn poster thẳng trong HTML làm LCP tăng từ khoảng 1980 ms lên khoảng 2200 ms.
 * Không có JavaScript thì video vẫn phát được, chỉ thiếu ảnh bìa.
 */
(function () {
  'use strict';
  var video = document.querySelector('.demo-video video[data-poster]');
  if (!video) return;

  function showPoster() {
    if (!video.getAttribute('poster')) video.setAttribute('poster', video.getAttribute('data-poster'));
  }

  function watch() {
    if (!('IntersectionObserver' in window)) {
      showPoster();
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            observer.disconnect();
            showPoster();
            return;
          }
        }
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(video);
  }

  if (document.readyState === 'complete') watch();
  else window.addEventListener('load', watch, { once: true });
})();
