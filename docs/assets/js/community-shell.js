/* 한국어 사이트의 공개 피드와 사랑방 프레임만 연결한다. 비공개 문의는 피드에서 다루지 않는다. */
(function () {
  'use strict';
  const byId = id => document.getElementById(id);
  const configured = window.HADONG_COMMUNITY_ENDPOINT;
  const endpoint = typeof configured === 'string' && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(configured) && configured === configured.trim() ? configured : null;
  const frame = byId('communityApp');
  if (frame && endpoint) {
    const direct = byId('cmAppDirect');
    window.addEventListener('message', event => {
      if (!event.data || event.data.type !== 'hadong-community-height') return;
      let source = event.source, fromOurFrame = false;
      try { for (let depth = 0; source && depth < 3; depth++) {
        if (source === frame.contentWindow) { fromOurFrame = true; break; }
        const parent = source.parent; if (parent === source) break; source = parent;
      } } catch (_) { return; }
      if (!fromOurFrame) return;
      if (event.origin !== 'https://script.google.com' && !/^https:\/\/(?:[a-z0-9-]+\.)+googleusercontent\.com$/.test(event.origin)) return;
      const height = event.data.height;
      if (typeof height === 'number' && Number.isFinite(height)) frame.height = String(Math.min(6000, Math.max(400, Math.ceil(height))));
    });
    direct.href = endpoint;
    direct.hidden = false;
    frame.src = endpoint;
    frame.hidden = false;
    byId('cmAppStatus').hidden = true;
  }

  const list = byId('cmRecentList');
  const status = byId('cmRecentStatus');
  if (!list || !status) return;
  if (!endpoint) {
    status.textContent = '사랑방 최근글을 준비하고 있습니다.';
    return;
  }

  status.textContent = '최근 한마디를 불러오는 중입니다.';
  const script = document.createElement('script');
  const url = new URL(endpoint);
  url.searchParams.set('action', 'feed');
  url.searchParams.set('callback', 'hadongRecentCallback');
  script.async = true;
  script.src = url.href;
  let finished = false;
  const timeout = window.setTimeout(fail, 12000);
  function finish() {
    finished = true;
    window.clearTimeout(timeout);
    script.onload = script.onerror = null;
    script.remove();
  }
  function fail() {
    if (finished) return;
    finish();
    status.textContent = '최근 글을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.';
  }
  window.hadongRecentCallback = function (payload) {
    if (finished) return;
    const entries = Array.isArray(payload) ? payload : payload && payload.ok !== false ? payload.items : null;
    if (!Array.isArray(entries)) { fail(); return; }
    if (entries.length === 0) {
      finish();
      status.textContent = '첫 이야기를 기다립니다.';
      return;
    }
    const fragment = document.createDocumentFragment();
    const seen = new Set();
    for (const entry of entries) {
      if (!entry || typeof entry.id !== 'string' || !entry.id.trim() || seen.has(entry.id) || typeof entry.nickname !== 'string' || !entry.nickname.trim() || typeof entry.message !== 'string' || !entry.message.trim()) continue;
      seen.add(entry.id);
      const row = document.createElement('li');
      const name = document.createElement('strong');
      const text = document.createElement('p');
      name.textContent = entry.nickname;
      text.textContent = entry.message;
      row.append(name, text);
      fragment.append(row);
      if (seen.size === 3) break;
    }
    if (!seen.size) { fail(); return; }
    finish();
    list.replaceChildren(fragment);
    list.hidden = false;
    status.textContent = '최근 한마디 ' + seen.size + '편을 불러왔습니다.';
    status.classList.add('cm-sr');
  };
  script.onerror = fail;
  script.onload = function () { if (!finished) fail(); };
  document.head.append(script);
}());
