const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_AVATAR_BUCKET || 'avatars';

let client = null;

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

async function removeAvatar(path) {
    if (!path) return;
    try {
        await getClient().storage.from(BUCKET).remove([path]);
    } catch (err) {
        console.warn('Foto lama gagal dihapus:', err.message);
    }
}

module.exports = { getClient, isConfigured, uploadAvatar, removeAvatar, BUCKET };