const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_AVATAR_BUCKET || 'avatars';
const BUCKET_BUKTI = process.env.SUPABASE_PROOF_BUCKET || 'bukti-bayar';

let client = null;

/**
 * Supabase dipakai khusus untuk menyimpan file (foto profil),
 * bukan untuk query data — data tetap lewat Prisma.
 * Service role key hanya hidup di backend, tidak pernah dikirim ke browser.
 */
function getClient() {
    if (!SUPABASE_URL || !SERVICE_KEY) {
        throw new Error(
            'SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diisi di .env backend'
        );
    }
    if (!client) {
        client = createClient(SUPABASE_URL, SERVICE_KEY, {
            auth: { persistSession: false },
        });
    }
    return client;
}

function isConfigured() {
    return Boolean(SUPABASE_URL && SERVICE_KEY);
}

/**
 * Unggah buffer gambar, balikan URL publik + path untuk penghapusan nanti.
 */
async function uploadAvatar(userId, buffer, mimeType) {
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    // Nama unik supaya cache browser tidak menampilkan foto lama
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await getClient()
        .storage.from(BUCKET)
        .upload(path, buffer, { contentType: mimeType, upsert: true });

    if (error) throw new Error(`Gagal mengunggah foto: ${error.message}`);

    const { data } = getClient().storage.from(BUCKET).getPublicUrl(path);

    return { url: data.publicUrl, path };
}

/**
 * Hapus file lama. Kegagalan di sini tidak dianggap fatal —
 * yang penting data user tetap konsisten.
 */
async function removeAvatar(path) {
    if (!path) return;
    try {
        await getClient().storage.from(BUCKET).remove([path]);
    } catch (err) {
        console.warn('Foto lama gagal dihapus:', err.message);
    }
}

/**
 * Unggah bukti pembayaran manual.
 * Disimpan di bucket terpisah dari foto profil supaya pengaturan
 * aksesnya bisa dibedakan kalau nanti diperketat.
 */
async function uploadBuktiBayar(itemId, buffer, mimeType) {
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const path = `${itemId}/${Date.now()}.${ext}`;

    const { error } = await getClient()
        .storage.from(BUCKET_BUKTI)
        .upload(path, buffer, { contentType: mimeType, upsert: false });

    if (error) throw new Error(`Gagal mengunggah bukti bayar: ${error.message}`);

    const { data } = getClient().storage.from(BUCKET_BUKTI).getPublicUrl(path);
    return { url: data.publicUrl, path };
}

/**
 * Unggah bukti transfer penerusan dana dari platform ke pemasok.
 * Disimpan di bucket yang sama dengan bukti bayar, dibedakan lewat
 * awalan jalur supaya mudah ditelusuri.
 */
async function uploadBuktiPayout(supplierId, buffer, mimeType) {
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const path = `payout/${supplierId}/${Date.now()}.${ext}`;

    const { error } = await getClient()
        .storage.from(BUCKET_BUKTI)
        .upload(path, buffer, { contentType: mimeType, upsert: false });

    if (error) throw new Error(`Gagal mengunggah bukti penerusan: ${error.message}`);

    const { data } = getClient().storage.from(BUCKET_BUKTI).getPublicUrl(path);
    return { url: data.publicUrl, path };
}

module.exports = {
    getClient,
    isConfigured,
    uploadAvatar,
    removeAvatar,
    uploadBuktiBayar,
    uploadBuktiPayout,
    BUCKET,
    BUCKET_BUKTI,
};