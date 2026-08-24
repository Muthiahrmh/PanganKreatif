export function AboutSection() {
    return (
        <section id="tentang" className="bg-white py-20">
            <div className="mx-auto max-w-[1000px] px-8 lg:px-16">
                <div className="mb-10 text-center">
                    <span className="text-sm font-semibold uppercase tracking-wide text-brand-blue">
                        Tentang Kami
                    </span>
                    <h2 className="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
                        PanganKreatif
                    </h2>
                </div>

                <div className="space-y-4 text-[15px] leading-relaxed text-ink-soft">
                    <p>
                        PanganKreatif merupakan inovasi yang dikembangkan oleh Tim
                        PanganKreatif dalam ajang KMIPN VIII 2026 bidang Perancangan
                        Bisnis TIK. Ide ini berawal dari permasalahan yang kami lihat
                        pada rantai pasok UMKM kuliner, khususnya dalam menentukan
                        kebutuhan bahan baku dan melakukan pengadaan secara efisien. Di
                        satu sisi, UMKM sering menghadapi risiko kelebihan maupun
                        kekurangan stok, sementara di sisi lain terdapat potensi
                        pasokan dari kelompok tani dan distributor yang belum
                        terhubung secara optimal dengan kebutuhan pasar.
                    </p>
                    <p>
                        Melalui PanganKreatif, kami menghadirkan platform B2B Supply
                        Chain yang mengintegrasikan AI Demand Forecasting dengan
                        Collective Procurement. Kami ingin membantu UMKM kuliner
                        mengambil keputusan pengadaan berdasarkan data, memperoleh
                        bahan baku secara lebih efisien, sekaligus menciptakan
                        hubungan yang lebih terintegrasi antara UMKM, distributor, dan
                        kelompok tani.
                    </p>
                </div>

                <div className="mt-10 grid gap-6 sm:grid-cols-2">
                    <div className="rounded-2xl bg-paper-soft p-6">
                        <h3 className="font-display text-lg font-bold text-ink">
                            Visi Kami
                        </h3>
                        <p className="mt-2 text-sm italic leading-relaxed text-ink-soft">
                            &ldquo;Mewujudkan ekosistem rantai pasok pangan yang cerdas,
                            efisien, dan berkelanjutan melalui pemanfaatan
                            teknologi.&rdquo;
                        </p>
                    </div>

                    <div className="rounded-2xl bg-paper-soft p-6">
                        <h3 className="font-display text-lg font-bold text-ink">
                            Misi Kami
                        </h3>
                        <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-soft">
                            <li className="flex gap-2">
                                <span className="text-brand-blue">•</span>
                                Mengoptimalkan pengadaan bahan baku UMKM melalui teknologi
                                AI Demand Forecasting agar kebutuhan stok dapat
                                direncanakan dengan lebih tepat.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-brand-blue">•</span>
                                Menghubungkan UMKM dengan distributor dan kelompok tani
                                melalui rantai pasok B2B yang terintegrasi.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-brand-blue">•</span>
                                Mendorong pengadaan yang lebih efisien melalui mekanisme
                                Collective Procurement sehingga UMKM dapat memperoleh
                                harga yang lebih kompetitif.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-brand-blue">•</span>
                                Mengurangi food waste dan meningkatkan efisiensi
                                operasional UMKM kuliner.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-brand-blue">•</span>
                                Menciptakan ekosistem pangan lokal yang saling
                                menguntungkan bagi UMKM, distributor, dan kelompok tani.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}