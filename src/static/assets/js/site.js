// 하동책방 홈페이지 공통 동작: 큰 글씨, 메뉴 열기, 나타나는 효과
(function(){
  var big=document.getElementById('bigBtn');
  function setBig(on){document.documentElement.classList.toggle('big',on);if(big){big.setAttribute('aria-pressed',on);big.textContent=on?(big.dataset.on||'가 보통 글씨로'):(big.dataset.off||'가 큰 글씨로 보기');}try{localStorage.setItem('hdBig',on?'1':'0')}catch(e){}}
  try{if(localStorage.getItem('hdBig')==='1')setBig(true)}catch(e){}
  if(big)big.addEventListener('click',function(){setBig(!document.documentElement.classList.contains('big'))});

  var mb=document.getElementById('menuBtn'),nav=document.getElementById('mainNav');
  if(mb&&nav)mb.addEventListener('click',function(){var o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o);var t=mb.querySelector('.t');t.textContent=o?(t.dataset.open||'닫기'):(t.dataset.closed||'메뉴')});

  var els=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target)}})},{threshold:.1});els.forEach(function(el){io.observe(el)})}
  else els.forEach(function(el){el.classList.add('on')});
})();
