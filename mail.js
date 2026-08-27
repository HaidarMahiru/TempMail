/**
 * TempMail Scraper & API Client (mailporary.com)
 * 
 * Fitur:
 * - Otomatis mengambil Token & Daftar Domain dari mailporary.com
 * - Custom Username & Domain pilihan
 * - Random Username Generator
 * - Cek Inbox / Cek Mail
 * - Detail Pesan & Raw Source EML
 * - Hapus Pesan & Purge Inbox
 * - Mode CLI Interaktif / Command-Line Arguments
 */

const crypto = require('crypto');
const readline = require('readline');

class TempMail {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://web.mailporary.com/api/v1';
    this.siteUrl = options.siteUrl || 'https://mailporary.com/id';
    this.userAgent = options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    this.token = options.token || null;
    this.domains = options.domains || [];
    this.username = options.username || null;
    this.domain = options.domain || null;
  }

  /**
   * Inisialisasi token & mengambil daftar domain dari mailporary.com
   */
  async init() {
    const res = await fetch(this.siteUrl, {
      headers: { 'User-Agent': this.userAgent }
    });
    
    if (!res.ok) {
      throw new Error(`Gagal membuka website: HTTP ${res.status}`);
    }

    const html = await res.text();
    const scriptMatch = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!scriptMatch) {
      throw new Error('Gagal mengekstrak payload __NUXT_DATA__');
    }

    const payload = JSON.parse(scriptMatch[1]);

    // Ekstrak Bearer Token (String diawali eyJ)
    this.token = payload.find(x => typeof x === 'string' && x.startsWith('eyJ'));
    if (!this.token) {
      throw new Error('Gagal menemukan MailService Token pada payload');
    }

    // Ekstrak Daftar Domain
    let domains = [];
    for (const item of payload) {
      if (item && typeof item === 'object' && item['$semailDomains'] !== undefined) {
        const idxArr = payload[item['$semailDomains']];
        if (Array.isArray(idxArr)) {
          domains = idxArr.map(idx => payload[idx]).filter(x => typeof x === 'string');
        }
      }
    }
    if (domains.length === 0) {
      domains = payload.filter(x => typeof x === 'string' && /^[a-z0-9-]+\.[a-z]{2,}$/i.test(x));
    }
    
    this.domains = domains;
    return { token: this.token, domains: this.domains };
  }

  /**
   * Helper statis untuk mendapatkan daftar domain tanpa set email dulu
   */
  static async getAvailableDomains() {
    const mail = new TempMail();
    await mail.init();
    return mail.domains;
  }

  /**
   * Buat username acak dengan awalan 'haidarapis-' dan 3 digit angka acak (100-999)
   */
  generateRandomUsername(prefix = 'haidarapis') {
    const threeDigits = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${threeDigits}`;
  }

  /**
   * Mengambil domain secara acak dari daftar domain yang tersedia
   */
  getRandomDomain() {
    if (this.domains && this.domains.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.domains.length);
      return this.domains[randomIndex];
    }
    return 'suarj.com';
  }

  /**
   * Setting username dan domain
   */
  setMail(username, domain) {
    if (!username) {
      username = this.generateRandomUsername();
    }
    this.username = username.toLowerCase().trim();

    if (domain) {
      this.domain = domain.toLowerCase().trim();
    } else {
      this.domain = this.getRandomDomain();
    }

    return this.getEmail();
  }

  /**
   * Dapatkan email lengkap
   */
  getEmail() {
    if (!this.username || !this.domain) {
      throw new Error('Username atau domain belum disetting. Gunakan setMail(username, domain)');
    }
    return `${this.username}@${this.domain}`;
  }

  /**
   * Header autentikasi & timestamp untuk API
   */
  getHeaders() {
    if (!this.token) {
      throw new Error('Token belum ada. Panggil init() terlebih dahulu.');
    }
    const requestId = crypto.randomBytes(16).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000).toString();

    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'X-Timestamp': timestamp,
      'User-Agent': this.userAgent
    };
  }

  /**
   * Cek Inbox / dapatkan daftar pesan
   */
  async getInbox() {
    const email = this.getEmail();
    const url = `${this.baseUrl}/mailbox/${encodeURIComponent(email)}`;
    
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: Gagal mengambil inbox - ${errText}`);
    }

    return await res.json();
  }

  /**
   * Alias untuk getInbox (Cek Mail)
   */
  async checkMail() {
    return this.getInbox();
  }

  /**
   * Ambil detail pesan berdasarkan ID
   */
  async getMessage(messageId) {
    const email = this.getEmail();
    const url = `${this.baseUrl}/mailbox/${encodeURIComponent(email)}/${encodeURIComponent(messageId)}`;
    
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Gagal mengambil detail pesan`);
    }

    return await res.json();
  }

  /**
   * Ambil source EML mentah berdasarkan ID
   */
  async getMessageSource(messageId) {
    const email = this.getEmail();
    const url = `${this.baseUrl}/mailbox/${encodeURIComponent(email)}/${encodeURIComponent(messageId)}/source`;
    
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Gagal mengambil source pesan`);
    }

    return await res.text();
  }

  /**
   * Hapus 1 pesan tertentu
   */
  async deleteMessage(messageId) {
    const email = this.getEmail();
    const url = `${this.baseUrl}/mailbox/${encodeURIComponent(email)}/${encodeURIComponent(messageId)}`;
    
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Gagal menghapus pesan`);
    }

    return { status: 'success', messageId };
  }

  /**
   * Bersihkan / hapus semua pesan di inbox
   */
  async purgeInbox() {
    const email = this.getEmail();
    const url = `${this.baseUrl}/mailbox/${encodeURIComponent(email)}`;
    
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Gagal membersihkan inbox`);
    }

    return { status: 'success', email };
  }

  /**
   * Loop pemantauan inbox secara realtime / polling
   */
  async monitorInbox({ intervalSeconds = 5, onMail, onError } = {}) {
    const seenIds = new Set();
    console.log(`\n[+] Memulai pemantauan inbox untuk: ${this.getEmail()}`);
    console.log(`[+] Polling setiap ${intervalSeconds} detik. Tekan Ctrl+C untuk berhenti.\n`);

    while (true) {
      try {
        const messages = await this.getInbox();
        if (Array.isArray(messages)) {
          const newMails = messages.filter(m => !seenIds.has(m.id));
          if (newMails.length > 0) {
            newMails.forEach(m => seenIds.add(m.id));
            if (typeof onMail === 'function') {
              onMail(newMails, messages);
            } else {
              console.log(`\n============================`);
              console.log(`[!] ADA EMAIL BARU (${newMails.length})`);
              console.log(`============================`);
              newMails.forEach(mail => {
                console.log(`ID     : ${mail.id}`);
                console.log(`From   : ${mail.from || mail.sender}`);
                console.log(`Subject: ${mail.subject}`);
                console.log(`Date   : ${mail.date || mail.createdAt}`);
                if (mail.body || mail.text || mail.html) {
                  console.log(`Content: ${mail.body || mail.text || mail.html}`);
                }
                console.log(`----------------------------`);
              });
            }
          }
        }
      } catch (err) {
        if (typeof onError === 'function') {
          onError(err);
        } else {
          console.error(`[Error Inbox] ${err.message}`);
        }
      }
      await new Promise(r => setTimeout(r, intervalSeconds * 1000));
    }
  }
}

// Export class sebagai module Node.js
module.exports = TempMail;

// Jika dijalankan langsung lewat CLI (node mail.js)
if (require.main === module) {
  (async () => {
    try {
      console.log('==================================================');
      console.log('      TEMPMAIL SCRAPER & CLIENT (mailporary)      ');
      console.log('==================================================');

      const args = process.argv.slice(2);
      let argName = null;
      let argDomain = null;

      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--name' || args[i] === '-n') {
          argName = args[i + 1];
        }
        if (args[i] === '--domain' || args[i] === '-d') {
          argDomain = args[i + 1];
        }
      }

      console.log('[*] Mengambil token dan daftar domain...');
      const tempMail = new TempMail();
      await tempMail.init();

      console.log(`[✓] Token berhasil didapatkan.`);
      console.log(`[✓] Domain tersedia (${tempMail.domains.length}):`, tempMail.domains.join(', '));

      let chosenName = argName;
      let chosenDomain = argDomain;

      if (!chosenName || !chosenDomain) {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const question = (q) => new Promise(r => rl.question(q, r));

        if (!chosenName) {
          const inputName = await question(`\nMasukkan Nama Email (Kosongkan untuk otomatis 'haidarapis-XX'): `);
          chosenName = inputName.trim() || null;
        }

        if (!chosenDomain) {
          console.log('\nPilih Domain:');
          tempMail.domains.forEach((d, idx) => {
            console.log(` ${idx + 1}. ${d}`);
          });
          const inputDom = await question(`Pilih nomor domain (1-${tempMail.domains.length}, atau Kosongkan untuk Acak): `);
          const domIdx = parseInt(inputDom.trim()) - 1;
          if (!isNaN(domIdx) && tempMail.domains[domIdx]) {
            chosenDomain = tempMail.domains[domIdx];
          } else {
            chosenDomain = tempMail.getRandomDomain();
          }
        }

        rl.close();
      }

      const email = tempMail.setMail(chosenName, chosenDomain);
      console.log(`\n==================================================`);
      console.log(` EMAIL SAAT INI : ${email}`);
      console.log(`==================================================`);

      // Cek Inbox pertama kali
      console.log('\n[*] Memeriksa inbox...');
      const inbox = await tempMail.getInbox();
      console.log(`[✓] Jumlah email di inbox: ${inbox.length}`);

      if (inbox.length > 0) {
        console.log('\nDaftar Email:');
        console.dir(inbox, { depth: null });
      } else {
        console.log('[i] Inbox masih kosong.');
      }

      // Mulai monitor
      await tempMail.monitorInbox({ intervalSeconds: 5 });

    } catch (err) {
      console.error('\n[X] Terjadi Kesalahan:', err.message);
    }
  })();
}
