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

/* 導覽列標示目前所在區塊。判定方式為「頂緣已捲過導覽列的最後一個區塊」，
   而非可見面積最大者——後者在長短懸殊的區塊之間會來回跳動。導覽列未收錄的區塊
   （受管帳號、重點能力等）沿用其前一個收錄區塊的標示，因其本就隸屬該段落。
   讀取以 rAF 節流，且只在需要換頁籤時才動 DOM。 */
(function(){
  var nav = document.querySelector('.nav-links');
  if(!nav) return;
  var items = [];
  Array.prototype.forEach.call(nav.querySelectorAll('a[href^="#"]'), function(a){
    var el;
    try{ el = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); }catch(e){ return; }
    if(el) items.push({a:a, el:el});
  });
  if(!items.length) return;

  var current = null;
  function mark(a){
    if(current === a) return;
    if(current){ current.classList.remove('is-current'); current.removeAttribute('aria-current'); }
    if(a){ a.classList.add('is-current'); a.setAttribute('aria-current', 'true'); }
    current = a;
  }
  function pick(){
    var hit = null, i;
    /* 判定線設在導覽列下緣稍下方，與 section[id] 的 scroll-margin-top 同一量級 */
    for(i = 0; i < items.length; i++){
      if(items[i].el.getBoundingClientRect().top <= 96) hit = items[i].a;
    }
    /* 最後一個區塊多半太短，頂緣永遠到不了判定線；捲抵頁尾時直接標示它 */
    if(window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4){
      hit = items[items.length - 1].a;
    }
    mark(hit);
  }

  var queued = false;
  function schedule(){
    if(queued) return;
    queued = true;
    requestAnimationFrame(function(){ queued = false; pick(); });
  }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  pick();
})();
