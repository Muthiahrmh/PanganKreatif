require('dotenv').config();
const dns = require('dns');
const nodemailer = require('nodemailer');

dns.setDefaultResultOrder('ipv4first');

const USER = process.env.SMTP_USER || '';
const PASS = process.env.SMTP_PASS || '';
const HOST = process.env.SMTP_HOST || 'smtp.gmail.com';

async function coba(port) {
    const label = `${HOST}:${port}`;
    process.stdout.write(`  ${label.padEnd(24)}`);

    const t = nodemailer.createTransport({
        host: HOST,
        port,
        secure: port === 465,
        auth: { user: USER, pass: PASS },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
    });

    try {
        await t.verify();
        console.log('BISA');
        return port;
    } catch (err) {
        console.log('gagal —', err.message);
        return null;
    }
}

async function main() {
    console.log('\nMemeriksa pengaturan SMTP\n');
    console.log('  SMTP_USER :', USER || '(kosong)');
    console.log('  SMTP_PASS :', PASS ? `${PASS.length} karakter` : '(kosong)');

    if (!USER || !PASS) {
        console.log('\nIsi dulu SMTP_USER dan SMTP_PASS di backend/.env\n');
        return;
    }

    console.log('\nMencoba menyambung:');
    const hasil465 = await coba(465);
    const hasil587 = await coba(587);

    const bisa = hasil465 ?? hasil587;

    console.log('');
    if (bisa) {
        console.log(`Pakai SMTP_PORT=${bisa} di backend/.env\n`);
    } else {
        console.log('Kedua port gagal. Kemungkinan penyebabnya:');
        console.log('  - Jaringan memblokir port SMTP (sering terjadi di wifi kampus)');
        console.log('  - App Password salah atau sudah dicabut');
        console.log('  - Coba lewat tethering HP untuk memastikan\n');
    }
}

main();