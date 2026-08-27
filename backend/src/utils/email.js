const nodemailer = require('nodemailer');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

const HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const PORT = Number(process.env.SMTP_PORT || 465);
const USER = process.env.SMTP_USER || '';
const PASS = process.env.SMTP_PASS || '';
const PENGIRIM = process.env.SMTP_FROM || `PanganKreatif <${USER}>`;

let transporter = null;

function terkonfigurasi() {
    return Boolean(USER && PASS);
}

function getTransporter() {
    if (!terkonfigurasi()) {
        throw new Error(
            'Pengiriman email belum dikonfigurasi. Isi SMTP_USER dan SMTP_PASS di .env backend.'
        );
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: HOST,
            port: PORT,
            secure: PORT === 465,
            auth: { user: USER, pass: PASS },
            connectionTimeout: 10_000,
            greetingTimeout: 10_000,
            socketTimeout: 15_000,
        });
    }

    return transporter;
}

function bungkus(judul, isi) {
    return `<!doctype html>
<html lang="id">
    <body style="margin:0;padding:24px;background:#f5f9ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
        <div style="font-size:20px;font-weight:700;color:#0b1220;">PanganKreatif</div>
        <div style="height:2px;width:48px;background:#16a34a;margin:12px 0 24px;"></div>

        <h1 style="margin:0 0 12px;font-size:18px;color:#0b1220;">${judul}</h1>
        ${isi}

        <p style="margin-top:32px;font-size:12px;color:#64748b;line-height:1.6;">
            Email ini dikirim otomatis oleh sistem PanganKreatif.
            Kalau kamu tidak merasa meminta ini, abaikan saja pesan ini.
        </p>
        </div>
    </body>
</html>`;
}

async function kirimVerifikasi({ email, nama, tautan, berlakuMenit = 5 }) {
    const isi = `
    <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7;">
        Halo ${nama}, terima kasih sudah mendaftar di PanganKreatif.
        Satu langkah lagi: klik tombol di bawah untuk memastikan alamat email ini benar milikmu.
    </p>

    <a href="${tautan}"
        style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;
                padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
        Verifikasi Email
    </a>

    <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.7;">
        Tautan ini berlaku ${berlakuMenit} menit. Kalau tombolnya tidak berfungsi,
        salin alamat berikut ke peramban:
    </p>
    <p style="margin:8px 0 0;font-size:12px;color:#2563eb;word-break:break-all;">${tautan}</p>
    `;

    await getTransporter().sendMail({
        from: PENGIRIM,
        to: email,
        subject: 'Verifikasi email PanganKreatif',
        html: bungkus('Verifikasi alamat emailmu', isi),
    });
}

async function kirimSelamatDatang({ email, nama, tautanMasuk }) {
    const isi = `
    <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7;">
        Halo ${nama}, emailmu sudah terverifikasi. Akunmu siap dipakai.
    </p>

    <a href="${tautanMasuk}"
        style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;
                padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
        Masuk ke PanganKreatif
    </a>
    `;

    try {
        await getTransporter().sendMail({
            from: PENGIRIM,
            to: email,
            subject: 'Akun PanganKreatif kamu sudah aktif',
            html: bungkus('Selamat datang', isi),
        });
    } catch (err) {
        console.warn('Email sambutan gagal dikirim:', err.message);
    }
}

async function kirimResetPassword({ email, nama, tautan, berlakuMenit = 30 }) {
    const isi = `
    <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7;">
        Halo ${nama}, kami menerima permintaan untuk mereset kata sandi akun PanganKreatif kamu.
        Klik tombol di bawah ini untuk membuat kata sandi baru:
    </p>

    <a href="${tautan}"
        style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;
                padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
        Reset Kata Sandi
    </a>

    <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.7;">
        Tautan ini berlaku ${berlakuMenit} menit. Kalau kamu tidak merasa meminta perubahan kata sandi, abaikan saja email ini.
    </p>
    <p style="margin:8px 0 0;font-size:12px;color:#2563eb;word-break:break-all;">${tautan}</p>
    `;

    await getTransporter().sendMail({
        from: PENGIRIM,
        to: email,
        subject: 'Permintaan Reset Kata Sandi PanganKreatif',
        html: bungkus('Reset Kata Sandi Akun', isi),
    });
}

async function ujiSambungan() {
    if (!terkonfigurasi()) {
        return { berhasil: false, pesan: 'SMTP_USER atau SMTP_PASS belum diisi di .env' };
    }

    try {
        await getTransporter().verify();
        return { berhasil: true, pesan: `Tersambung ke ${HOST}:${PORT} sebagai ${USER}` };
    } catch (err) {
        return { berhasil: false, pesan: err.message };
    }
}

module.exports = { terkonfigurasi, kirimVerifikasi, kirimSelamatDatang, kirimResetPassword, ujiSambungan };