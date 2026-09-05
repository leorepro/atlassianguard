/* 首屏影片採點擊後載入：初次進站只下載本地縮圖，按下播放才向 YouTube 發出請求。
   未啟用指令碼時，連結維持原本行為，於新分頁開啟 YouTube。 */
(function(){
  var btn = document.querySelector('.hv-btn');
  if(!btn) return;
  btn.addEventListener('click', function(e){
    e.preventDefault();
    var f = document.createElement('iframe');
    f.className = 'hv-frame';
    f.src = 'https://www.youtube-nocookie.com/embed/4NUYNM5H4RI?autoplay=1&rel=0&cc_load_policy=1';
    f.title = 'Safeguard mission-critical work with Atlassian Guard';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
    f.allowFullscreen = true;
    btn.replaceWith(f);
  });
})();

/* 能力卡的操作錄影：三欄縮圖中的主控台介面過小而不可辨讀，
   因此播放時將該卡展開至整列寬度，暫停後復原，同一時間僅一段播放。 */
(function(){
  var cards = document.querySelectorAll('.pdr-caps-grid .capcard video');
  if(!cards.length) return;
  Array.prototype.forEach.call(cards, function(v){
    var card = v.closest('.capcard');
    v.addEventListener('play', function(){
      Array.prototype.forEach.call(cards, function(o){
        if(o !== v && !o.paused) o.pause();
      });
      card.classList.add('is-playing');
      /* 展開後若卡片頂緣被導覽列遮住，捲回可見範圍 */
      var top = card.getBoundingClientRect().top;
      if(top < 76) window.scrollBy({top: top - 88, behavior: 'smooth'});
    });
    v.addEventListener('pause', function(){ card.classList.remove('is-playing'); });
  });
})();

/* 場景分組收合：五組預設收合成橫條，若網址錨點（導覽晶片或帶 hash 進站）指向
   收合中的分組，先展開再捲到該組，否則讀者只會看到一條橫條而不知內容在哪。
   未啟用指令碼時，錨點仍會捲到橫條，讀者可自行點開。 */
(function(){
  function openGroup(hash){
    if(!hash || hash.length < 2) return;
    var el;
    try{ el = document.getElementById(decodeURIComponent(hash.slice(1))); }catch(e){ return; }
    if(!el || !el.classList.contains('case-group') || el.open) return;
    el.open = true;
    /* 展開後文件變長，原本可能捲不到位的目標現在捲得到；scroll-margin-top 由 CSS 負責 */
    el.scrollIntoView({block:'start'});
  }
  window.addEventListener('hashchange', function(){ openGroup(location.hash); });
  /* 重複點同一枚晶片不會觸發 hashchange，另監聽站內錨點的點擊 */
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="#g-"]');
    if(a) openGroup(a.getAttribute('href'));
  });
  openGroup(location.hash);
})();
