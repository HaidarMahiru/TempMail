const TempMail = require('./mail.js');

(async () => {
  try {
    // 1. Inisialisasi TempMail
    const tempMail = new TempMail();
    await tempMail.init();

    console.log('Domain Tersedia:', tempMail.domains);

    // 2. Set Email Otomatis (Default: 'haidarapis-XX' 2 digit + Domain Random)
    const randomEmail = tempMail.setMail(); 
    console.log('Alamat Email Otomatis:', randomEmail);

    // 3. Atau Set Custom Nama & Domain Manual
    // const customEmail = tempMail.setMail('haidarapis-99', 'suarj.com');
    // console.log('Alamat Email Custom:', customEmail);

    // 4. Cek Inbox Pesan (Sekali Cek)
    console.log('\n[+] Memeriksa Inbox...');
    const messages = await tempMail.checkMail();
    console.log('Respons Inbox:', messages);

  } catch (error) {
    console.error('Error:', error.message);
  }
})();
