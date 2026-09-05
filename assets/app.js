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

/* 捲動時要更新的三件事，共用同一個 rAF 節流的監聽器：導覽列的所在區塊標示、
   導覽列底緣的閱讀進度條，以及回到頂端按鈕的顯隱。三者的觸發時機相同，分開掛
   監聽器只是多繞路；各自在目標元素不存在時略過，彼此不相依。

   所在區塊的判定方式為「頂緣已捲過導覽列的最後一個區塊」，而非可見面積最大者
   ——後者在長短懸殊的區塊之間會來回跳動。導覽列未收錄的區塊（受管帳號、重點
   能力等）沿用其前一個收錄區塊的標示，因其本就隸屬該段落。 */
(function(){
  var nav = document.querySelector('.nav-links');
  var bar = document.querySelector('.nav');
  var toTop = document.querySelector('.to-top');
  if(!nav && !bar && !toTop) return;
  var items = [];
  if(nav) Array.prototype.forEach.call(nav.querySelectorAll('a[href^="#"]'), function(a){
    var el;
    try{ el = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); }catch(e){ return; }
    if(el) items.push({a:a, el:el});
  });

  var current = null;
  function mark(a){
    if(current === a) return;
    if(current){ current.classList.remove('is-current'); current.removeAttribute('aria-current'); }
    if(a){ a.classList.add('is-current'); a.setAttribute('aria-current', 'true'); }
    current = a;
  }
  var lastRatio = -1, lastOn = null;
  function pick(){
    var doc = document.documentElement;
    var y = window.scrollY;
    var atEnd = window.innerHeight + y >= doc.scrollHeight - 4;

    if(items.length){
      var hit = null, i;
      /* 判定線設在導覽列下緣稍下方，與 section[id] 的 scroll-margin-top 同一量級 */
      for(i = 0; i < items.length; i++){
        if(items[i].el.getBoundingClientRect().top <= 96) hit = items[i].a;
      }
      /* 最後一個區塊多半太短，頂緣永遠到不了判定線；捲抵頁尾時直接標示它 */
      if(atEnd) hit = items[items.length - 1].a;
      mark(hit);
    }

    if(bar){
      /* 可捲動距離為 0 時（內容短於視窗）視為已讀完，避免除以零 */
      var span = doc.scrollHeight - window.innerHeight;
      var ratio = span > 0 ? Math.min(1, Math.max(0, y / span)) : 1;
      /* 只在肉眼可辨的變動量才寫入，省下捲動中大量無意義的樣式異動 */
      if(Math.abs(ratio - lastRatio) > 0.002 || ratio === 0 || ratio === 1){
        bar.style.setProperty('--read-progress', ratio.toFixed(4));
        lastRatio = ratio;
      }
    }

    if(toTop){
      /* 捲過一個視窗高度才出現：首屏本來就看得到頁首，不需要這顆按鈕 */
      var on = y > window.innerHeight;
      if(on !== lastOn){ toTop.classList.toggle('is-on', on); lastOn = on; }
    }
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

/* 章節錨點：在每個 section[id] 的 h2 後掛一枚 #，點擊複製該節的完整連結。
   業務同仁常要把單一段落傳給客戶，原本只能自己拼 URL。
   複製失敗時（clipboard API 需安全環境，或使用者拒絕授權）不吞掉事件，
   讓瀏覽器照常跳到該錨點，網址列一樣會出現可複製的連結。 */
(function(){
  var heads = document.querySelectorAll('section[id] > h2');
  if(!heads.length) return;
  var timer = null;

  Array.prototype.forEach.call(heads, function(h2){
    var id = h2.parentNode.id;
    var a = document.createElement('a');
    a.className = 'h-anchor';
    a.href = '#' + id;
    a.textContent = '#';
    a.setAttribute('aria-label', '複製「' + h2.textContent.trim() + '」這一節的連結');

    a.addEventListener('click', function(e){
      if(!navigator.clipboard || !navigator.clipboard.writeText) return;  /* 照常跳錨點 */
      var url = location.origin + location.pathname + '#' + id;
      e.preventDefault();
      navigator.clipboard.writeText(url).then(function(){
        /* 同時間只留一個「已複製」，避免連點多節後畫面上散著好幾個 */
        var prev = document.querySelector('.h-anchor.is-copied');
        if(prev) prev.classList.remove('is-copied');
        clearTimeout(timer);
        a.classList.add('is-copied');
        timer = setTimeout(function(){ a.classList.remove('is-copied'); }, 1600);
        /* 網址列同步更新，讀者按上一頁時的行為與直接點錨點一致 */
        history.replaceState(null, '', '#' + id);
      }, function(){
        location.hash = id;   /* 寫入剪貼簿被拒，退回原本的跳轉行為 */
      });
    });

    h2.appendChild(a);
  });
})();
