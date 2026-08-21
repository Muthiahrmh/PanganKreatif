const prisma = require('../utils/prisma');
const { prakiraanUntukKota } = require('../utils/bmkg');

async function getForecast(req, res) {
    let kota = req.query.city ? String(req.query.city) : null;

    if (!kota) {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { umkmProfile: true, supplierProfile: true },
        });
        kota = user?.umkmProfile?.city || user?.supplierProfile?.city || null;
    }

    const hasil = await prakiraanUntukKota(kota);
    res.json(hasil);
}

module.exports = { getForecast };