require('dotenv').config();
const app = require('./app');
const { mulaiPenjadwalAutoKonfirmasi, HARI_AUTO_KONFIRMASI } = require('./utils/escrow');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`PanganKreatif backend jalan di port ${PORT}`);

  // Pesanan yang sudah dikirim tapi tidak dikonfirmasi UMKM akan dilepas
  // sendiri setelah batas waktunya, supaya dana pemasok tidak menggantung.
  mulaiPenjadwalAutoKonfirmasi(30);
  console.log(`Escrow aktif — konfirmasi otomatis ${HARI_AUTO_KONFIRMASI} hari setelah dikirim`);
});
