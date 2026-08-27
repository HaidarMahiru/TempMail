/**
 * TempMail Soft Neobrutalism Web Application Client Logic
 * Vector SVG Icons Only (No Emojis), SEO & Google AI Optimized
 */

document.addEventListener('DOMContentLoaded', () => {

  // Global State
  let currentEmail = '';
  let availableDomains = [];
  let currentMessages = [];
  let expandedMailIds = new Set(); // Track expanded cards
  
  // Polling State
  let isAutoRefresh = true;
  let pollInterval = 5; // seconds
  let secondsRemaining = pollInterval;
  let countdownTimerId = null;

  // DOM Elements
  const elCurrentEmail = document.getElementById('current-email-input');
  const elDomainsCount = document.getElementById('domains-count-badge');
  const elApiStatusText = document.getElementById('api-status-text');
  const elTotalMessages = document.getElementById('total-messages-count');
  const elInboxBadge = document.getElementById('inbox-count-badge');
  const elMessageList = document.getElementById('message-list-container');
  const elSearchInput = document.getElementById('inbox-search-input');
  
  // Countdown DOM
  const elAutoSwitch = document.getElementById('auto-refresh-switch');
  const elCountdownTimer = document.getElementById('countdown-timer');
  const elProgressBar = document.getElementById('countdown-progress');
  const elRefreshIcon = document.getElementById('refresh-icon');

  // Initialize Lucide Vector Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // --- URL Routing Helpers ---
  function getEmailFromUrl() {
    const path = window.location.pathname;
    const matchEmailPath = path.match(/^\/email\/([^/]+)/) || path.match(/^\/([^/@]+@[^/]+)/);
    if (matchEmailPath && matchEmailPath[1] && matchEmailPath[1].includes('@')) {
      return decodeURIComponent(matchEmailPath[1]);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const qEmail = urlParams.get('email') || urlParams.get('e');
    if (qEmail && qEmail.includes('@')) {
      return qEmail.trim();
    }

    return null;
  }

  function getMessageIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || urlParams.get('msg');
  }

  function updateBrowserUrl(email) {
    if (!email) return;
    const targetPath = `/email/${encodeURIComponent(email)}`;
    if (window.location.pathname !== targetPath && window.location.pathname !== '/') {
      window.history.pushState({ email: email }, '', targetPath);
    }
  }

  window.addEventListener('popstate', () => {
    const urlEmail = getEmailFromUrl();
    if (urlEmail && urlEmail !== currentEmail) {
      switchToEmail(urlEmail, false);
    }
  });

  // --- Safe String / Text Converter (Fixes [object Object]) ---
  function getTextValue(val, fallback = '') {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      if (val.name && val.address) return `${val.name} <${val.address}>`;
      if (val.address) return val.address;
      if (val.name) return val.name;
      if (val.text) return val.text;
      if (val.html) return val.html;
      if (val.body) return val.body;
      if (val.value) return val.value;
      try {
        return JSON.stringify(val);
      } catch {
        return fallback;
      }
    }
    return String(val);
  }

  // Helper HTML escaper
  function escapeHtml(str) {
    const text = getTextValue(str, '');
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Helper URL Auto-Linkifier for plain text
  function linkifyText(text) {
    if (!text) return '';
    const escaped = escapeHtml(text);
    const urlRegex = /(https?:\/\/[^\s<"'\(\)]+)/gi;
    return escaped.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: bold; word-break: break-all;">${url}</a>`;
    });
  }

  // Quoted-Printable Decoder for EML Source
  function decodeQuotedPrintable(str) {
    if (!str) return '';
    return str
      .replace(/=\r?\n/g, '')
      .replace(/=([0-9A-F]{2})/gi, (m, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  // --- Extract All Links (From HTML, Body, and Raw EML Source) ---
  function extractAllLinks(htmlContent, textContent, rawSource) {
    const links = [];
    const seenUrls = new Set();

    function addLink(label, url) {
      if (!url || typeof url !== 'string' || !url.startsWith('http')) return;
      url = url.replace(/["'>\s]+$/, ''); // Clean trailing delimiters
      if (seenUrls.has(url)) return;
      seenUrls.add(url);

      let cleanLabel = getTextValue(label, 'Link Login / Tautan Email').trim();
      if (!cleanLabel || cleanLabel.length > 60 || cleanLabel.startsWith('http')) {
        if (url.includes('firebaseapp.com') || url.includes('alight')) {
          cleanLabel = 'Login ke Alight Creative';
        } else {
          cleanLabel = 'Link Login / Verifikasi Akun';
        }
      }
      links.push({ label: cleanLabel, url: url });
    }

    const rawHtml = getTextValue(htmlContent, '');
    const rawText = getTextValue(textContent, '');
    const decodedSource = decodeQuotedPrintable(getTextValue(rawSource, ''));

    // 1. Extract <a> tags from HTML & decoded source
    [rawHtml, decodedSource].forEach(content => {
      if (content) {
        try {
          const anchorMatches = content.match(/<a\s+[^>]*href=["']?([^"'>\s]+)["']?[^>]*>(.*?)<\/a>/gi);
          if (anchorMatches) {
            anchorMatches.forEach(m => {
              const hrefMatch = m.match(/href=["']?([^"'>\s]+)["']?/i);
              const textMatch = m.match(/>([^<]+)</);
              if (hrefMatch && hrefMatch[1]) {
                addLink(textMatch ? textMatch[1] : 'Login ke Alight Creative', hrefMatch[1]);
              }
            });
          }
        } catch (e) {}
      }
    });

    // 2. Extract raw URLs using Regex from combined text & decoded EML
    const combined = rawHtml + ' ' + rawText + ' ' + decodedSource;
    const urlRegex = /(https?:\/\/[^\s<>"'\(\)]+)/gi;
    let match;
    while ((match = urlRegex.exec(combined)) !== null) {
      addLink('Login ke Alight Creative', match[1]);
    }

    return links;
  }

  // --- Toast Notification Helper ---
  function showToast(message, type = 'mint') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `neo-toast ${type}`;
    
    let iconName = 'check-circle';
    if (type === 'pink') iconName = 'sparkles';
    if (type === 'yellow') iconName = 'info';
    if (type === 'danger') iconName = 'alert-triangle';
    if (type === 'purple') iconName = 'zap';

    toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- API Functions ---
  async function initApp() {
    try {
      const res = await fetch('/api/init');
      const data = await res.json();

      if (data.status === 'success') {
        availableDomains = data.domains || [];
        elDomainsCount.textContent = `${availableDomains.length} Domain`;
        elApiStatusText.textContent = 'Online';

        // Check if email is specified in URL (e.g. /email/haidarapis-45@anogz.com)
        const initialUrlEmail = getEmailFromUrl();
        if (initialUrlEmail) {
          await switchToEmail(initialUrlEmail, false);
          
          const targetMsgId = getMessageIdFromUrl();
          if (targetMsgId) {
            expandedMailIds.add(targetMsgId);
          }
        } else {
          // ALWAYS generate brand new random email on homepage load
          await generateRandomEmail();
        }
      } else {
        showToast('Gagal terhubung ke API server', 'danger');
        elApiStatusText.textContent = 'Offline';
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'danger');
    }
  }

  async function generateRandomEmail() {
    try {
      const res = await fetch('/api/create');
      const data = await res.json();

      if (data.status === 'success') {
        currentEmail = data.email;
        elCurrentEmail.value = currentEmail;
        showToast(`Email Aktif: ${currentEmail}`, 'mint');
        
        updateBrowserUrl(currentEmail);
        expandedMailIds.clear();
        await fetchInbox(true);
      } else {
        showToast(`Gagal set email: ${data.message}`, 'danger');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'danger');
    }
  }

  async function switchToEmail(inputEmail, updateUrl = true) {
    const emailToSet = inputEmail.trim().toLowerCase();
    if (!emailToSet || !emailToSet.includes('@')) {
      showToast('Masukkan alamat email yang valid (contoh: haidarapis-482@anogz.com)', 'yellow');
      return;
    }

    currentEmail = emailToSet;
    elCurrentEmail.value = currentEmail;
    showToast(`Masuk ke Email: ${currentEmail}`, 'mint');

    if (updateUrl) {
      updateBrowserUrl(currentEmail);
    }

    expandedMailIds.clear();
    currentMessages = [];
    await fetchInbox(true);
  }

  async function fetchInbox(forceRender = false) {
    if (!currentEmail) return;

    if (elRefreshIcon) elRefreshIcon.classList.add('spin-anim');

    try {
      const res = await fetch(`/api/inbox?email=${encodeURIComponent(currentEmail)}`);
      const data = await res.json();

      if (data.status === 'success') {
        const fetchedMessages = data.messages || [];
        
        // Merge with simulated test messages if any
        const simulatedMails = currentMessages.filter(m => m.isSimulated);
        const newTotalMessages = [...simulatedMails, ...fetchedMessages];

        // Check if inbox message list actually changed to prevent DOM re-render flickering
        const currentIds = currentMessages.map(m => m.id).join(',');
        const newIds = newTotalMessages.map(m => m.id).join(',');

        if (forceRender || currentIds !== newIds) {
          currentMessages = newTotalMessages;
          renderMessageList(currentMessages);
        } else {
          // Silent count update without DOM re-render
          elTotalMessages.textContent = currentMessages.length;
          elInboxBadge.textContent = currentMessages.length;
        }
      }
    } catch (err) {
      console.error('Error fetching inbox:', err);
    } finally {
      if (elRefreshIcon) elRefreshIcon.classList.remove('spin-anim');
    }
  }

  // --- Simulation Email Generator (Alight Creative Firebase Login Example) ---
  function simulateIncomingMail() {
    const mockId = 'sim_' + Date.now();
    const loginLink = `https://alight-creative.firebaseapp.com/__/auth/action?mode=signIn&oobCode=apiKeyCheck${Math.floor(100000 + Math.random() * 900000)}`;

    const mockMail = {
      id: mockId,
      isSimulated: true,
      from: 'noreply@alight-creative.firebaseapp.com',
      subject: `Login ke Alight Creative yang diminta pada ${new Date().toUTCString()}`,
      date: new Date().toISOString(),
      body: `Halo,\n\nKami menerima permintaan untuk login ke Alight Creative menggunakan alamat email ini.\nJika Anda ingin login dengan akun ${currentEmail} Anda, klik link ini:\n\nLogin ke Alight Creative: ${loginLink}\n\nJika Anda tidak meminta link ini, harap abaikan email ini.\n\nTerima Kasih,\nTim Alight Creative Anda`,
      html: `
        <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 20px; background-color: #fcfbf7; border-radius: 12px; border: 2px solid #18181b;">
          <h3 style="color: #18181b; margin-top: 0;">Login ke Alight Creative</h3>
          <p style="color: #52525b; font-size: 14px;">Halo,</p>
          <p style="color: #52525b; font-size: 14px;">Kami menerima permintaan untuk login ke Alight Creative menggunakan alamat email ini (<strong>${escapeHtml(currentEmail)}</strong>).</p>
          <p style="color: #52525b; font-size: 14px;">Jika Anda ingin login ke akun Anda, klik tombol atau link di bawah ini:</p>
          
          <div style="margin: 20px 0;">
            <a href="${loginLink}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 22px; border-radius: 8px;">Login ke Alight Creative</a>
          </div>

          <p style="font-size: 13px; color: #6b7280;">Jika Anda tidak meminta link ini, harap abaikan email ini.<br><br>Terima Kasih,<br><strong>Tim Alight Creative Anda</strong></p>
        </div>
      `
    };

    currentMessages.unshift(mockMail);
    expandedMailIds.add(mockId);
    renderMessageList(currentMessages);
    showToast(`Email Alight Creative Diterima! Link login berhasil diekstrak`, 'purple');
  }

  // --- Render Direct Inbox List ---
  function renderMessageList(messages) {
    const searchTerm = elSearchInput.value.toLowerCase().trim();
    
    let filtered = messages;
    if (searchTerm) {
      filtered = messages.filter(m => {
        const subj = getTextValue(m.subject, '').toLowerCase();
        const fromStr = getTextValue(m.from || m.sender, '').toLowerCase();
        return subj.includes(searchTerm) || fromStr.includes(searchTerm);
      });
    }

    elTotalMessages.textContent = messages.length;
    elInboxBadge.textContent = messages.length;

    if (filtered.length === 0) {
      elMessageList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon-box yellow">
            <i data-lucide="mail-open"></i>
          </div>
          <h3>Kotak Masuk Kosong</h3>
          <p>Email aktif saat ini: <strong>${escapeHtml(currentEmail)}</strong>. Belum ada email masuk.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    elMessageList.innerHTML = '';
    filtered.forEach(msg => {
      const card = document.createElement('div');
      const isExpanded = expandedMailIds.has(msg.id);
      card.className = `direct-mail-card ${isExpanded ? 'expanded' : ''}`;
      
      const formattedDate = msg.date ? new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Baru saja';
      const senderText = getTextValue(msg.from || msg.sender, 'Pengirim');
      const subjectText = getTextValue(msg.subject, '(Tanpa Subjek)');
      const openInTabUrl = `/email/${encodeURIComponent(currentEmail)}?id=${encodeURIComponent(msg.id)}`;

      if (!isExpanded) {
        // Collapsed Summary View
        card.innerHTML = `
          <div class="mail-card-header">
            <div class="mail-sender-title">
              <span class="sender-name">${msg.isSimulated ? '[Test] ' : ''}${escapeHtml(senderText)}</span>
              <div class="mail-subject-text">${escapeHtml(subjectText)}</div>
            </div>
            <div class="mail-card-meta">
              <span>${formattedDate}</span>
              <i data-lucide="chevron-down"></i>
            </div>
          </div>
        `;

        card.addEventListener('click', () => {
          expandedMailIds.add(msg.id);
          renderMessageList(currentMessages);
        });

      } else {
        // Expanded View
        card.innerHTML = `
          <div class="mail-card-header-expanded">
            <div class="mail-sender-title">
              <span class="sender-name">${msg.isSimulated ? '[Test] ' : ''}${escapeHtml(senderText)}</span>
              <div class="mail-subject-text">${escapeHtml(subjectText)}</div>
              <span class="mail-date-badge">${formattedDate}</span>
            </div>
            <div style="display:flex; gap:6px;">
              <a href="${openInTabUrl}" target="_blank" class="neo-btn-sm yellow" title="Buka di Tab Baru">
                <i data-lucide="external-link"></i>
                <span>Tab Baru</span>
              </a>
              <button class="neo-btn-sm cyan btn-back-single">
                <i data-lucide="arrow-left"></i>
                <span>Kembali</span>
              </button>
            </div>
          </div>
          
          <div class="mail-body-container">
            <div id="mail-links-extracted-${msg.id}"></div>
            <div class="mail-content-area" id="mail-content-${msg.id}">
              <div class="mail-text-direct">Memuat isi pesan tempmail...</div>
            </div>
            <div class="mail-card-footer">
              <a href="${openInTabUrl}" target="_blank" class="neo-btn-sm yellow">
                <i data-lucide="external-link"></i>
                <span>Tab Baru</span>
              </a>
              <div style="display:flex; gap:6px;">
                <button class="neo-btn-sm cyan btn-back-single">
                  <i data-lucide="arrow-left"></i>
                  <span>Kembali</span>
                </button>
                <button class="neo-btn-sm danger btn-delete-single">
                  <i data-lucide="trash-2"></i>
                  <span>Hapus Pesan</span>
                </button>
              </div>
            </div>
          </div>
        `;

        // Back button handlers
        card.querySelectorAll('.btn-back-single').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            expandedMailIds.delete(msg.id);
            renderMessageList(currentMessages);
          });
        });

        // Delete button handler
        const btnDelete = card.querySelector('.btn-delete-single');
        if (btnDelete) {
          btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSingleMail(msg.id);
          });
        }

        setTimeout(() => loadMailDirectContent(msg), 0);
      }

      elMessageList.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  async function loadMailDirectContent(msg) {
    const area = document.getElementById(`mail-content-${msg.id}`);
    const linksContainer = document.getElementById(`mail-links-extracted-${msg.id}`);
    if (!area) return;

    if (msg.isSimulated) {
      renderIframeOrText(area, msg.id, msg.html, msg.body || msg.text);
      renderExtractedLinksSection(linksContainer, msg.html, msg.body || msg.text, '');
      return;
    }

    // Fetch message details AND raw EML source in parallel!
    try {
      const [msgRes, sourceRes] = await Promise.all([
        fetch(`/api/message?email=${encodeURIComponent(currentEmail)}&id=${encodeURIComponent(msg.id)}`).then(r => r.json()).catch(() => null),
        fetch(`/api/source?email=${encodeURIComponent(currentEmail)}&id=${encodeURIComponent(msg.id)}`).then(r => r.json()).catch(() => null)
      ]);

      const detail = (msgRes && msgRes.status === 'success') ? msgRes.message : null;
      const sourceText = (sourceRes && sourceRes.status === 'success') ? sourceRes.source : '';

      const htmlVal = detail ? getTextValue(detail.html, '') : '';
      const bodyVal = detail ? getTextValue(detail.body || detail.text || msg.body || msg.text, '') : getTextValue(msg.body || msg.text, '');

      renderIframeOrText(area, msg.id, htmlVal, bodyVal);
      renderExtractedLinksSection(linksContainer, htmlVal, bodyVal, sourceText);
    } catch (err) {
      const fallbackText = getTextValue(msg.body || msg.text, 'Error memuat pesan.');
      area.innerHTML = `<div class="mail-text-direct">${linkifyText(fallbackText)}</div>`;
      renderExtractedLinksSection(linksContainer, '', fallbackText, '');
    }
  }

  function renderIframeOrText(areaEl, id, htmlVal, bodyVal) {
    if (htmlVal && htmlVal.trim().length > 0) {
      areaEl.innerHTML = `<iframe class="mail-direct-content" id="iframe-${id}"></iframe>`;
      const iframe = document.getElementById(`iframe-${id}`);
      if (iframe) {
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <base target="_blank">
            <style>
              body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; padding: 14px; margin: 0; color: #18181b; line-height: 1.55; word-wrap: break-word; }
              a { color: #2563eb !important; text-decoration: underline !important; font-weight: bold !important; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>${htmlVal}</body>
          </html>
        `);
        doc.close();

        // Auto height adjustment
        setTimeout(() => {
          try {
            const h = iframe.contentWindow.document.body.scrollHeight;
            if (h > 100) {
              iframe.style.height = `${Math.min(Math.max(h + 20, 200), 600)}px`;
            }
          } catch (e) {}
        }, 150);
      }
    } else {
      areaEl.innerHTML = `<div class="mail-text-direct">${linkifyText(bodyVal || 'Tidak ada konten.')}</div>`;
    }
  }

  // --- Render Extracted Links Section (With Copy & Open URL Buttons) ---
  function renderExtractedLinksSection(containerEl, htmlVal, bodyVal, sourceText) {
    if (!containerEl) return;
    const links = extractAllLinks(htmlVal, bodyVal, sourceText);

    if (!links || links.length === 0) {
      containerEl.innerHTML = '';
      return;
    }

    let linksHtml = `
      <div class="extracted-links-box">
        <div class="extracted-link-title">
          <i data-lucide="link-2"></i>
          <span>TAUTAN LOGIN DITEMUKAN (${links.length}):</span>
        </div>
    `;

    links.forEach((l) => {
      linksHtml += `
        <div class="extracted-link-item">
          <span class="link-label">${escapeHtml(l.label)}</span>
          <div class="link-url-text">${escapeHtml(l.url)}</div>
          <div class="link-action-btns">
            <button class="neo-btn-sm mint btn-copy-link-url" data-url="${escapeHtml(l.url)}">
              <i data-lucide="copy"></i>
              <span>Salin Link</span>
            </button>
            <a href="${escapeHtml(l.url)}" target="_blank" class="neo-btn-sm cyan">
              <i data-lucide="external-link"></i>
              <span>Buka Link</span>
            </a>
          </div>
        </div>
      `;
    });

    linksHtml += `</div>`;
    containerEl.innerHTML = linksHtml;

    if (window.lucide) lucide.createIcons();

    // Attach copy button listeners
    containerEl.querySelectorAll('.btn-copy-link-url').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const urlToCopy = btn.dataset.url;
        if (urlToCopy) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(urlToCopy).then(() => {
              showToast('Link Login berhasil disalin ke clipboard!', 'mint');
            }).catch(() => {
              showToast('Link disalin!', 'mint');
            });
          } else {
            showToast('Link disalin!', 'mint');
          }
        }
      });
    });
  }

  async function deleteSingleMail(messageId) {
    try {
      const targetMail = currentMessages.find(m => m.id === messageId);
      if (targetMail && !targetMail.isSimulated) {
        await fetch(`/api/message?email=${encodeURIComponent(currentEmail)}&id=${encodeURIComponent(messageId)}`, { method: 'DELETE' });
      }
      showToast('Pesan berhasil dihapus', 'danger');
      expandedMailIds.delete(messageId);
      currentMessages = currentMessages.filter(m => m.id !== messageId);
      renderMessageList(currentMessages);
    } catch (err) {
      showToast(`Error: ${err.message}`, 'danger');
    }
  }

  // --- Auto Refresh Countdown Loop ---
  function startCountdownLoop() {
    if (countdownTimerId) clearInterval(countdownTimerId);
    secondsRemaining = pollInterval;

    countdownTimerId = setInterval(() => {
      if (!isAutoRefresh) return;

      secondsRemaining--;
      if (secondsRemaining <= 0) {
        secondsRemaining = pollInterval;
        fetchInbox();
      }

      elCountdownTimer.textContent = secondsRemaining;
      const progressPercent = (secondsRemaining / pollInterval) * 100;
      elProgressBar.style.width = `${progressPercent}%`;
    }, 1000);
  }

  // --- Event Listeners ---

  // Copy Email Button
  document.getElementById('btn-copy-email').addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentEmail) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentEmail).then(() => {
        showToast('Alamat Email berhasil disalin!', 'mint');
      }).catch(() => {
        fallbackCopy();
      });
    } else {
      fallbackCopy();
    }
  });

  function fallbackCopy() {
    elCurrentEmail.select();
    document.execCommand('copy');
    showToast('Alamat Email berhasil disalin!', 'mint');
  }

  // Random Email Button
  document.getElementById('btn-random-email').addEventListener('click', () => {
    generateRandomEmail();
  });

  // Simulation Email Button (Alight Creative Firebase Example)
  document.getElementById('btn-simulate-mail').addEventListener('click', () => {
    simulateIncomingMail();
  });

  // Manual Refresh Button
  document.getElementById('btn-manual-refresh').addEventListener('click', () => {
    secondsRemaining = pollInterval;
    fetchInbox(true);
    showToast('Memeriksa inbox terbaru...', 'cyan');
  });

  // Auto Refresh Switch
  elAutoSwitch.addEventListener('change', (e) => {
    isAutoRefresh = e.target.checked;
    showToast(isAutoRefresh ? 'Auto Refresh diaktifkan' : 'Auto Refresh dijeda', isAutoRefresh ? 'mint' : 'yellow');
  });

  // Search Filter Input
  elSearchInput.addEventListener('input', () => {
    renderMessageList(currentMessages);
  });

  // Purge Inbox Button
  document.getElementById('btn-purge-inbox').addEventListener('click', async () => {
    if (!currentEmail) return;
    if (confirm(`Yakin ingin mengosongkan semua pesan di inbox ${currentEmail}?`)) {
      try {
        await fetch(`/api/inbox?email=${encodeURIComponent(currentEmail)}`, { method: 'DELETE' });
        showToast('Inbox berhasil dibersihkan', 'danger');
        currentMessages = [];
        expandedMailIds.clear();
        renderMessageList([]);
      } catch (err) {
        showToast(`Error: ${err.message}`, 'danger');
      }
    }
  });

  // Start App
  initApp();
  startCountdownLoop();

});
