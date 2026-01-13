import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useKecamatanStore, KECAMATAN_BY_KABUPATEN, KECAMATAN_LIST, createKecamatanKey } from '@/store/kecamatanStore';

// Exact color definitions
const COLORS = {
    keringDefault: 'FFFFFF00',    // Yellow #FFFF00
    basahDefault: 'FFDAEEF3',     // Light blue #DAEEF3
    hthKeringPdkm: 'FFED7D31',    // Orange #ED7D31
    hthBasahPdcht: 'FF00B050',    // Dark green #00B050
    musimKemarau: 'FFFFC000',     // Orange #FFC000
    musimHujan: 'FF66FF99',       // Bright green #66FF99
    ringkasanKombinasi: 'FFFFCCFF', // Light pink #FFCCFF
    white: 'FFFFFFFF',
    black: 'FF000000',
};

// Sorted kabupaten order as requested
const KABUPATEN_ORDER = ['Bantul', 'Gunungkidul', 'Kota Yogyakarta', 'Kulon Progo', 'Sleman'] as const;

// Generate sorted kecamatan list with kabupaten info
const getSortedKecamatanList = () => {
    const result: { kabupaten: string; kecamatan: string }[] = [];

    KABUPATEN_ORDER.forEach(kab => {
        const kecs = KECAMATAN_BY_KABUPATEN[kab as keyof typeof KECAMATAN_BY_KABUPATEN];
        if (kecs) {
            // Sort kecamatan alphabetically within each kabupaten
            const sortedKecs = [...kecs].sort((a, b) => a.localeCompare(b));
            sortedKecs.forEach(kec => {
                result.push({ kabupaten: kab, kecamatan: kec });
            });
        }
    });

    return result;
};

// Classification rules (same as kabupaten)
const getKeringClassification = (score: number): { kelas: number; kategori: string } => {
    if (score >= 16) return { kelas: 3, kategori: 'Awas' };
    if (score >= 12) return { kelas: 2, kategori: 'Siaga' };
    if (score >= 8) return { kelas: 1, kategori: 'Waspada' };
    return { kelas: 0, kategori: 'Aman' };
};

const getBasahClassification = (score: number): { kelas: number; kategori: string } => {
    if (score >= 16) return { kelas: 3, kategori: 'Awas' };
    if (score >= 12) return { kelas: 2, kategori: 'Siaga' };
    if (score >= 8) return { kelas: 1, kategori: 'Waspada' };
    return { kelas: 0, kategori: 'Aman' };
};

const getCombinedClassification = (keringKelas: number, basahKelas: number): { kelas: string; kategori: string } => {
    const combined = keringKelas * 10 + basahKelas;
    const mappings: Record<number, { kelas: string; kategori: string }> = {
        0: { kelas: '00', kategori: 'Aman' },
        1: { kelas: '01', kategori: 'Waspada' },
        2: { kelas: '02', kategori: 'Siaga' },
        3: { kelas: '03', kategori: 'Awas' },
        10: { kelas: '10', kategori: 'Waspada' },
        11: { kelas: '11', kategori: 'Siaga' },
        12: { kelas: '12', kategori: 'Siaga' },
        13: { kelas: '13', kategori: 'Awas' },
        20: { kelas: '20', kategori: 'Siaga' },
        21: { kelas: '21', kategori: 'Siaga' },
        22: { kelas: '22', kategori: 'Awas' },
        23: { kelas: '23', kategori: 'Awas' },
        30: { kelas: '30', kategori: 'Awas' },
        31: { kelas: '31', kategori: 'Awas' },
        32: { kelas: '32', kategori: 'Awas' },
        33: { kelas: '33', kategori: 'Awas' },
    };
    return mappings[combined] || { kelas: '00', kategori: 'Aman' };
};

const applyHeaderStyle = (cell: ExcelJS.Cell, bgColor: string, bold = true, fontSize = 10) => {
    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
    };
    cell.font = { name: 'Calibri', bold, size: fontSize };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };
};

const applyDataCellStyle = (cell: ExcelJS.Cell, bgColor: string = COLORS.white) => {
    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
    };
    cell.font = { name: 'Calibri', size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };
};

export const exportToExcelKec = async () => {
    const state = useKecamatanStore.getState();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SKPG Tools - Kecamatan';
    workbook.created = new Date();

    // Get sorted kecamatan list
    const sortedKecamatan = getSortedKecamatanList();

    // Collect data for all kecamatan
    const allData = sortedKecamatan.map((item) => {
        const kec = item.kecamatan;
        const kab = item.kabupaten;
        // Use unique key to lookup data (handles duplicate names like Jetis)
        const kecKey = createKecamatanKey(kab, kec);
        const kecData = state.kecamatanData[kecKey];

        const keringData = {
            elNino: kecData?.globalAnomaliesDry?.elNino || 0,
            iodPositif: kecData?.globalAnomaliesDry?.iodPositif || 0,
            hthKering: state.hthData.results?.[kecKey]?.hth_kering || 0,
            musimKemarau: kecData?.seasonToggles?.musimKemarau || 0,
            chBulananRendah: state.chshMonthly.results?.[kecKey]?.ch_bulanan_rendah || 0,
            shBulananBN: state.chshMonthly.results?.[kecKey]?.sh_bulanan_BN || 0,
            chDasarianRendah: state.chshDasarian.results?.[kecKey]?.ch_bulanan_rendah || 0,
            shDasarianBN: state.chshDasarian.results?.[kecKey]?.sh_bulanan_BN || 0,
            pdkm: kecData?.pdkm?.pdkm || 0,
            elNinoBerlanjut: kecData?.globalAnomaliesDry?.elNinoBerlanjut || 0,
            iodPositifBerlanjut: kecData?.globalAnomaliesDry?.iodPositifBerlanjut || 0,
            bulanPlus1Kemarau: kecData?.seasonToggles?.bulanPlus1MusimKemarau || 0,
            chPlus1Rendah: state.chshPredictionPlus1.results?.[kecKey]?.ch_bulanan_rendah || 0,
            shPlus1BN: state.chshPredictionPlus1.results?.[kecKey]?.sh_bulanan_BN || 0,
            chPlus2Rendah: state.chshPredictionPlus2.results?.[kecKey]?.ch_bulanan_rendah || 0,
            shPlus2BN: state.chshPredictionPlus2.results?.[kecKey]?.sh_bulanan_BN || 0,
            chPlus3Rendah: state.chshPredictionPlus3.results?.[kecKey]?.ch_bulanan_rendah || 0,
            shPlus3BN: state.chshPredictionPlus3.results?.[kecKey]?.sh_bulanan_BN || 0,
        };

        const basahData = {
            laNina: kecData?.globalAnomaliesWet?.laNina || 0,
            iodNegatif: kecData?.globalAnomaliesWet?.iodNegatif || 0,
            hthBasah: state.hthData.results?.[kecKey]?.hth_basah || 0,
            musimHujan: kecData?.seasonToggles?.musimHujan || 0,
            chBulananTinggi: state.chshMonthly.results?.[kecKey]?.ch_bulanan_tinggi || 0,
            shBulananAN: state.chshMonthly.results?.[kecKey]?.sh_bulanan_AN || 0,
            chDasarianTinggi: state.chshDasarian.results?.[kecKey]?.ch_bulanan_tinggi || 0,
            shDasarianAN: state.chshDasarian.results?.[kecKey]?.sh_bulanan_AN || 0,
            pdcht: kecData?.pdkm?.pdcht || 0,
            laNinaBerlanjut: kecData?.globalAnomaliesWet?.laNinaBerlanjut || 0,
            iodNegatifBerlanjut: kecData?.globalAnomaliesWet?.iodNegatifBerlanjut || 0,
            bulanPlus1Hujan: kecData?.seasonToggles?.bulanPlus1MusimHujan || 0,
            chPlus1Tinggi: state.chshPredictionPlus1.results?.[kecKey]?.ch_bulanan_tinggi || 0,
            shPlus1AN: state.chshPredictionPlus1.results?.[kecKey]?.sh_bulanan_AN || 0,
            chPlus2Tinggi: state.chshPredictionPlus2.results?.[kecKey]?.ch_bulanan_tinggi || 0,
            shPlus2AN: state.chshPredictionPlus2.results?.[kecKey]?.sh_bulanan_AN || 0,
            chPlus3Tinggi: state.chshPredictionPlus3.results?.[kecKey]?.ch_bulanan_tinggi || 0,
            shPlus3AN: state.chshPredictionPlus3.results?.[kecKey]?.sh_bulanan_AN || 0,
        };

        const keringTotal = Object.values(keringData).reduce((sum, val) => sum + (Number(val) || 0), 0);
        const basahTotal = Object.values(basahData).reduce((sum, val) => sum + (Number(val) || 0), 0);

        const keringClass = getKeringClassification(keringTotal);
        const basahClass = getBasahClassification(basahTotal);
        const combinedClass = getCombinedClassification(keringClass.kelas, basahClass.kelas);

        return {
            kabupaten: item.kabupaten,
            kecamatan: item.kecamatan,
            kering: keringData,
            keringTotal,
            keringKelas: keringClass.kelas,
            keringKategori: keringClass.kategori,
            basah: basahData,
            basahTotal,
            basahKelas: basahClass.kelas,
            basahKategori: basahClass.kategori,
            combinedKelas: combinedClass.kelas,
            combinedKategori: combinedClass.kategori,
        };
    });

    // ========== MAIN SHEET ==========
    const ws = workbook.addWorksheet('Data SKPG Kecamatan', {
        views: [{ state: 'frozen', xSplit: 4, ySplit: 6 }]
    });

    // Column widths (added Kapanewon column after Kabupaten)
    ws.columns = [
        { width: 4 },   // A: No
        { width: 5 },   // B: Prov
        { width: 16 },  // C: Kabupaten
        { width: 16 },  // D: Kapanewon (Kecamatan)
        // Kering Section (E-V = 18 cols)
        { width: 10 }, { width: 10 },  // E-F: El Nino, IOD+ (wider)
        { width: 6 },   // G: HTH
        { width: 12 },  // H: Musim Kemarau (wider)
        { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },  // I-L: CH/SH Bulanan & Dasarian (wider)
        { width: 10 },   // M: Ada PDKM (wider)
        { width: 12 }, { width: 12 }, { width: 12 },  // N-P: Prediksi
        { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },  // Q-V: CH/SH Prediksi
        // Ringkasan Kering (W-Y = 3 cols)
        { width: 10 }, { width: 8 }, { width: 12 },
        // Basah Section (Z-AQ = 18 cols)
        { width: 10 }, { width: 10 },  // Z-AA (wider)
        { width: 8 },   // AB: HTH Basah
        { width: 12 },  // AC: Musim Hujan (wider)
        { width: 16 }, { width: 14 }, { width: 16 }, { width: 14 },  // AD-AG: CH/SH Bulanan & Dasarian (wider)
        { width: 10 },   // AH: Ada PDCHT (wider)
        { width: 12 }, { width: 12 }, { width: 12 },  // AI-AK
        { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },  // AL-AQ
        // Ringkasan Basah (AR-AT = 3 cols)
        { width: 10 }, { width: 8 }, { width: 12 },
        // Ringkasan Kombinasi (AU-AV = 2 cols)
        { width: 12 }, { width: 12 },
    ];

    // === ROW 1: Main Title ===
    ws.getRow(1).height = 23;
    ws.mergeCells('A1:AV1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'Identifikasi Anomali Iklim sebagai Salah Satu Faktor Penentu dalam SKPG - Level Kecamatan';
    titleCell.font = { name: 'Calibri', bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // === ROW 2: Score explanation ===
    ws.getRow(2).height = 18;
    ws.mergeCells('A2:AV2');
    const scoreCell = ws.getCell('A2');
    scoreCell.value = 'Jika iya skor = 1 dan jika tidak skor = 0';
    scoreCell.font = { name: 'Calibri', italic: true, size: 10 };
    scoreCell.alignment = { horizontal: 'left', vertical: 'middle' };

    // === ROW 3: Empty ===
    ws.getRow(3).height = 8;

    // === ROW 4: Main Category Headers ===
    ws.getRow(4).height = 25;

    // No, Prov, Kab, Kapanewon - merge rows 4-6
    ws.mergeCells('A4:A6');
    ws.mergeCells('B4:B6');
    ws.mergeCells('C4:C6');
    ws.mergeCells('D4:D6');
    applyHeaderStyle(ws.getCell('A4'), COLORS.white);
    applyHeaderStyle(ws.getCell('B4'), COLORS.white);
    applyHeaderStyle(ws.getCell('C4'), COLORS.white);
    applyHeaderStyle(ws.getCell('D4'), COLORS.white);
    ws.getCell('A4').value = 'No';
    ws.getCell('B4').value = 'Prov';
    ws.getCell('C4').value = 'Kabupaten';
    ws.getCell('D4').value = 'Kapanewon';

    // KERING main header (E4:V4)
    ws.mergeCells('E4:V4');
    const keringMainCell = ws.getCell('E4');
    keringMainCell.value = 'Anomali Iklim yang Berpotensi Mengakibatkan Kondisi Lebih Kering';
    applyHeaderStyle(keringMainCell, COLORS.keringDefault, true, 11);

    // Ringkasan Potensi Kering (W4:Y5)
    ws.mergeCells('W4:Y5');
    const ringkasanKeringCell = ws.getCell('W4');
    ringkasanKeringCell.value = 'Ringkasan Potensi Kering';
    applyHeaderStyle(ringkasanKeringCell, COLORS.keringDefault);

    // BASAH main header (Z4:AQ4)
    ws.mergeCells('Z4:AQ4');
    const basahMainCell = ws.getCell('Z4');
    basahMainCell.value = 'Anomali Iklim yang Berpotensi Mengakibatkan Kondisi Lebih Basah';
    applyHeaderStyle(basahMainCell, COLORS.basahDefault, true, 11);

    // Ringkasan Potensi Basah (AR4:AT5)
    ws.mergeCells('AR4:AT5');
    const ringkasanBasahCell = ws.getCell('AR4');
    ringkasanBasahCell.value = 'Ringkasan Potensi Basah';
    applyHeaderStyle(ringkasanBasahCell, COLORS.basahDefault);

    // Ringkasan Potensi Anomali Iklim (AU4:AV5)
    ws.mergeCells('AU4:AV5');
    const ringkasanKombinasiCell = ws.getCell('AU4');
    ringkasanKombinasiCell.value = 'Ringkasan Potensi Anomali Iklim';
    applyHeaderStyle(ringkasanKombinasiCell, COLORS.ringkasanKombinasi);

    // === ROW 5: Sub-category Headers ===
    ws.getRow(5).height = 20;

    // Kering sub-headers
    ws.mergeCells('E5:F5');
    applyHeaderStyle(ws.getCell('E5'), COLORS.keringDefault);
    ws.getCell('E5').value = 'Anomali Iklim Global';

    ws.mergeCells('G5:M5');
    applyHeaderStyle(ws.getCell('G5'), COLORS.keringDefault);
    ws.getCell('G5').value = 'Monitoring Iklim Regional';

    ws.mergeCells('N5:V5');
    applyHeaderStyle(ws.getCell('N5'), COLORS.keringDefault);
    ws.getCell('N5').value = 'Prediksi Iklim Hingga Tiga Bulan Ke Depan';

    // Basah sub-headers
    ws.mergeCells('Z5:AA5');
    applyHeaderStyle(ws.getCell('Z5'), COLORS.basahDefault);
    ws.getCell('Z5').value = 'Anomali Iklim Global';

    ws.mergeCells('AB5:AH5');
    applyHeaderStyle(ws.getCell('AB5'), COLORS.basahDefault);
    ws.getCell('AB5').value = 'Monitoring Iklim Regional';

    ws.mergeCells('AI5:AQ5');
    applyHeaderStyle(ws.getCell('AI5'), COLORS.basahDefault);
    ws.getCell('AI5').value = 'Prediksi Iklim Hingga Tiga Bulan Ke Depan';

    // === ROW 6: Column Headers ===
    ws.getRow(6).height = 45;

    // Column config (shifted by 1 due to new Kapanewon column)
    const columnConfig: Record<number, { header: string; headerColor: string; dataColor: string }> = {
        // Kering Section
        5: { header: 'El Nino', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        6: { header: 'IOD Positif', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        7: { header: 'HTH', headerColor: COLORS.hthKeringPdkm, dataColor: COLORS.hthKeringPdkm },
        8: { header: 'Musim Kemarau', headerColor: COLORS.musimKemarau, dataColor: COLORS.white },
        9: { header: 'Curah Hujan Bulanan Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        10: { header: 'Sifat Hujan Bulanan BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        11: { header: 'Curah Hujan Dasarian Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        12: { header: 'Sifat Hujan Dasarian BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        13: { header: 'Ada PDKM', headerColor: COLORS.hthKeringPdkm, dataColor: COLORS.hthKeringPdkm },
        14: { header: 'El Nino Berlanjut', headerColor: COLORS.keringDefault, dataColor: COLORS.keringDefault },
        15: { header: 'IOD+ Berlanjut', headerColor: COLORS.keringDefault, dataColor: COLORS.keringDefault },
        16: { header: 'Bulan+1 Kemarau', headerColor: COLORS.musimKemarau, dataColor: COLORS.white },
        17: { header: 'Curah Hujan Bulan+1 Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        18: { header: 'Sifat Hujan Bulan+1 BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        19: { header: 'Curah Hujan Bulan+2 Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        20: { header: 'Sifat Hujan Bulan+2 BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        21: { header: 'Curah Hujan Bulan+3 Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        22: { header: 'Sifat Hujan Bulan+3 BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        // Ringkasan Kering
        23: { header: 'Total Skor', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        24: { header: 'Kelas', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        25: { header: 'Kategori', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        // Basah Section
        26: { header: 'La Nina', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        27: { header: 'IOD Negatif', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        28: { header: 'HTH Basah', headerColor: COLORS.hthBasahPdcht, dataColor: COLORS.hthBasahPdcht },
        29: { header: 'Musim Hujan', headerColor: COLORS.musimHujan, dataColor: COLORS.white },
        30: { header: 'Curah Hujan Bulanan Tinggi/ Sangat Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        31: { header: 'Sifat Hujan Bulanan AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        32: { header: 'Curah Hujan Dasarian Tinggi/ Sangat Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        33: { header: 'Sifat Hujan Dasarian AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        34: { header: 'Ada PDCHT', headerColor: COLORS.hthBasahPdcht, dataColor: COLORS.hthBasahPdcht },
        35: { header: 'La Nina Berlanjut', headerColor: COLORS.basahDefault, dataColor: COLORS.basahDefault },
        36: { header: 'IOD- Berlanjut', headerColor: COLORS.basahDefault, dataColor: COLORS.basahDefault },
        37: { header: 'Bulan+1 Hujan', headerColor: COLORS.musimHujan, dataColor: COLORS.white },
        38: { header: 'Curah Hujan Bulan+1 Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        39: { header: 'Sifat Hujan Bulan+1 AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        40: { header: 'Curah Hujan Bulan+2 Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        41: { header: 'Sifat Hujan Bulan+2 AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        42: { header: 'Curah Hujan Bulan+3 Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        43: { header: 'Sifat Hujan Bulan+3 AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        // Ringkasan Basah
        44: { header: 'Total Skor', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        45: { header: 'Kelas', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        46: { header: 'Kategori', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        // Ringkasan Kombinasi
        47: { header: 'Kombinasi Kelas', headerColor: COLORS.ringkasanKombinasi, dataColor: COLORS.ringkasanKombinasi },
        48: { header: 'Kategori', headerColor: COLORS.ringkasanKombinasi, dataColor: COLORS.white },
    };

    // Apply row 6 headers
    Object.entries(columnConfig).forEach(([colIdx, config]) => {
        const col = parseInt(colIdx);
        const cell = ws.getCell(6, col);
        cell.value = config.header;
        applyHeaderStyle(cell, config.headerColor);
    });

    // === DATA ROWS (starting from row 7) ===
    allData.forEach((row, idx) => {
        const rowNum = idx + 7;
        const excelRow = ws.getRow(rowNum);
        excelRow.height = 18;

        const values = [
            idx + 1,           // 1: No
            'DIY',             // 2: Prov
            row.kabupaten,     // 3: Kabupaten
            row.kecamatan,     // 4: Kapanewon (Kecamatan)
            // Kering data
            row.kering.elNino, // 5
            row.kering.iodPositif, // 6
            row.kering.hthKering, // 7
            row.kering.musimKemarau, // 8
            row.kering.chBulananRendah, // 9
            row.kering.shBulananBN, // 10
            row.kering.chDasarianRendah, // 11
            row.kering.shDasarianBN, // 12
            row.kering.pdkm, // 13
            row.kering.elNinoBerlanjut, // 14
            row.kering.iodPositifBerlanjut, // 15
            row.kering.bulanPlus1Kemarau, // 16
            row.kering.chPlus1Rendah, // 17
            row.kering.shPlus1BN, // 18
            row.kering.chPlus2Rendah, // 19
            row.kering.shPlus2BN, // 20
            row.kering.chPlus3Rendah, // 21
            row.kering.shPlus3BN, // 22
            // Ringkasan Kering
            row.keringTotal, // 23
            row.keringKelas, // 24
            row.keringKategori, // 25
            // Basah data
            row.basah.laNina, // 26
            row.basah.iodNegatif, // 27
            row.basah.hthBasah, // 28
            row.basah.musimHujan, // 29
            row.basah.chBulananTinggi, // 30
            row.basah.shBulananAN, // 31
            row.basah.chDasarianTinggi, // 32
            row.basah.shDasarianAN, // 33
            row.basah.pdcht, // 34
            row.basah.laNinaBerlanjut, // 35
            row.basah.iodNegatifBerlanjut, // 36
            row.basah.bulanPlus1Hujan, // 37
            row.basah.chPlus1Tinggi, // 38
            row.basah.shPlus1AN, // 39
            row.basah.chPlus2Tinggi, // 40
            row.basah.shPlus2AN, // 41
            row.basah.chPlus3Tinggi, // 42
            row.basah.shPlus3AN, // 43
            // Ringkasan Basah
            row.basahTotal, // 44
            row.basahKelas, // 45
            row.basahKategori, // 46
            // Ringkasan Kombinasi
            row.combinedKelas, // 47
            row.combinedKategori, // 48
        ];

        values.forEach((value, colIdx) => {
            const col = colIdx + 1;
            const cell = ws.getCell(rowNum, col);
            cell.value = value;

            const config = columnConfig[col];
            const dataColor = config ? config.dataColor : COLORS.white;
            applyDataCellStyle(cell, dataColor);
        });
    });

    // ========== SHEET 2: RINGKASAN ==========
    const wsRingkasan = workbook.addWorksheet('Ringkasan');

    // Column widths for Ringkasan
    wsRingkasan.columns = [
        { width: 4 },   // A: No
        { width: 8 },   // B: Provinsi
        { width: 16 },  // C: Kabupaten
        { width: 16 },  // D: Kapanewon
        { width: 8 },   // E: Skor Kering
        { width: 8 },   // F: Kelas Kering
        { width: 12 },  // G: Kategori Kering
        { width: 8 },   // H: Skor Basah
        { width: 8 },   // I: Kelas Basah
        { width: 12 },  // J: Kategori Basah
        { width: 14 },  // K: Kombinasi Kelas
        { width: 12 },  // L: Kategori
    ];

    // Get current month and year for title
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const currentMonth = months[new Date().getMonth()];
    const currentYear = new Date().getFullYear();

    // Row 1: Main Title
    wsRingkasan.getRow(1).height = 20;
    wsRingkasan.mergeCells('A1:L1');
    const ringkasanTitle = wsRingkasan.getCell('A1');
    ringkasanTitle.value = 'Ringkasan Identifikasi Anomali Iklim sebagai Salah Satu Faktor Rekomendasi dalam SKPG - Level Kecamatan';
    ringkasanTitle.font = { name: 'Calibri', bold: true, size: 12 };
    ringkasanTitle.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 2: Update date
    wsRingkasan.mergeCells('A2:L2');
    const updateDate = wsRingkasan.getCell('A2');
    updateDate.value = `Update ${currentMonth} ${currentYear}`;
    updateDate.font = { name: 'Calibri', bold: true, size: 11 };
    updateDate.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 3: Empty
    wsRingkasan.getRow(3).height = 8;

    // Row 4: Main category headers
    wsRingkasan.getRow(4).height = 20;

    // No, Provinsi, Kabupaten, Kapanewon - merge rows 4-5
    wsRingkasan.mergeCells('A4:A5');
    wsRingkasan.mergeCells('B4:B5');
    wsRingkasan.mergeCells('C4:C5');
    wsRingkasan.mergeCells('D4:D5');
    applyHeaderStyle(wsRingkasan.getCell('A4'), COLORS.white);
    applyHeaderStyle(wsRingkasan.getCell('B4'), COLORS.white);
    applyHeaderStyle(wsRingkasan.getCell('C4'), COLORS.white);
    applyHeaderStyle(wsRingkasan.getCell('D4'), COLORS.white);
    wsRingkasan.getCell('A4').value = 'No';
    wsRingkasan.getCell('B4').value = 'Provinsi';
    wsRingkasan.getCell('C4').value = 'Kabupaten';
    wsRingkasan.getCell('D4').value = 'Kapanewon';

    // Ringkasan Potensi Kering (E4:G4)
    wsRingkasan.mergeCells('E4:G4');
    const ringkasanKeringHeader = wsRingkasan.getCell('E4');
    ringkasanKeringHeader.value = 'Ringkasan Potensi Kering';
    applyHeaderStyle(ringkasanKeringHeader, COLORS.keringDefault);

    // Ringkasan Potensi Basah (H4:J4)
    wsRingkasan.mergeCells('H4:J4');
    const ringkasanBasahHeader = wsRingkasan.getCell('H4');
    ringkasanBasahHeader.value = 'Ringkasan Potensi Basah';
    applyHeaderStyle(ringkasanBasahHeader, COLORS.basahDefault);

    // Ringkasan Kondisi Iklim (K4:L4)
    wsRingkasan.mergeCells('K4:L4');
    const ringkasanKondisiHeader = wsRingkasan.getCell('K4');
    ringkasanKondisiHeader.value = 'Ringkasan Kondisi Iklim';
    applyHeaderStyle(ringkasanKondisiHeader, COLORS.ringkasanKombinasi);

    // Row 5: Sub-headers
    wsRingkasan.getRow(5).height = 20;

    // Kering sub-headers
    applyHeaderStyle(wsRingkasan.getCell('E5'), COLORS.keringDefault);
    wsRingkasan.getCell('E5').value = 'Skor';
    applyHeaderStyle(wsRingkasan.getCell('F5'), COLORS.keringDefault);
    wsRingkasan.getCell('F5').value = 'Kelas';
    applyHeaderStyle(wsRingkasan.getCell('G5'), COLORS.keringDefault);
    wsRingkasan.getCell('G5').value = 'Kategori';

    // Basah sub-headers
    applyHeaderStyle(wsRingkasan.getCell('H5'), COLORS.basahDefault);
    wsRingkasan.getCell('H5').value = 'Skor';
    applyHeaderStyle(wsRingkasan.getCell('I5'), COLORS.basahDefault);
    wsRingkasan.getCell('I5').value = 'Kelas';
    applyHeaderStyle(wsRingkasan.getCell('J5'), COLORS.basahDefault);
    wsRingkasan.getCell('J5').value = 'Kategori';

    // Kondisi Iklim sub-headers
    applyHeaderStyle(wsRingkasan.getCell('K5'), COLORS.ringkasanKombinasi);
    wsRingkasan.getCell('K5').value = 'Kombinasi Kelas';
    applyHeaderStyle(wsRingkasan.getCell('L5'), COLORS.ringkasanKombinasi);
    wsRingkasan.getCell('L5').value = 'Kategori';

    // Data rows (starting from row 6)
    allData.forEach((row, idx) => {
        const rowNum = idx + 6;
        const excelRow = wsRingkasan.getRow(rowNum);
        excelRow.height = 18;

        const values = [
            idx + 1,           // A: No
            'DIY',             // B: Provinsi
            row.kabupaten,     // C: Kabupaten
            row.kecamatan,     // D: Kapanewon
            row.keringTotal,   // E: Skor Kering
            row.keringKelas,   // F: Kelas Kering
            row.keringKategori, // G: Kategori Kering
            row.basahTotal,    // H: Skor Basah
            row.basahKelas,    // I: Kelas Basah
            row.basahKategori, // J: Kategori Basah
            row.combinedKelas, // K: Kombinasi Kelas
            row.combinedKategori, // L: Kategori
        ];

        values.forEach((value, colIdx) => {
            const col = colIdx + 1;
            const cell = wsRingkasan.getCell(rowNum, col);
            cell.value = value;
            applyDataCellStyle(cell, COLORS.white);
        });
    });

    // ========== SHEET 3: KETERANGAN ==========
    const wsKeterangan = workbook.addWorksheet('Keterangan');

    wsKeterangan.columns = [
        { width: 10 },
        { width: 15 },
        { width: 60 },
        { width: 20 },
        { width: 10 },
    ];

    wsKeterangan.addRow(['Keterangan untuk Kondisi Kering dan Kondisi Basah']);
    wsKeterangan.mergeCells('A1:E1');
    wsKeterangan.getCell('A1').font = { name: 'Calibri', bold: true, size: 12 };

    wsKeterangan.addRow(['Batas', 'Kelas', 'Kategori', 'Jumlah Skor (Max 18)', '']);
    wsKeterangan.getRow(2).font = { name: 'Calibri', bold: true };

    wsKeterangan.addRow([0, 0, 'Aman', '<=7']);
    wsKeterangan.addRow([8, 1, 'Waspada', '8 - 11']);
    wsKeterangan.addRow([12, 2, 'Siaga', '12 - 15']);
    wsKeterangan.addRow([16, 3, 'Awas', '>=16']);

    wsKeterangan.addRow([]);
    wsKeterangan.addRow(['Data Level: Kecamatan (78 Kecamatan di DIY)']);
    wsKeterangan.addRow(['Urutan Kabupaten: Bantul, Gunungkidul, Kota Yogyakarta, Kulon Progo, Sleman']);

    // Generate filename
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `SKPG_DIY_Kecamatan_${timestamp}.xlsx`;

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
};
