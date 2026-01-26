import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useCombinedStore } from '@/store/combinedStore';
import { KABUPATEN_LIST } from '@/store/wizardStore';
import { KECAMATAN_LIST, getKecamatanFromKey } from '@/store/kecamatanStore';
import { toast } from '@/hooks/use-toast';

// Exact color definitions (ARGB format)
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

// Classification rules
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
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.font = { name: 'Calibri', bold, size: fontSize };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
};

const applyDataCellStyle = (cell: ExcelJS.Cell, bgColor: string = COLORS.white) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.font = { name: 'Calibri', size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
};

// Helper to collect data for a region
const collectKabupatenData = (state: any, kab: string) => {
    const kabData = state.kabupatenData[kab];
    if (!kabData) return null;

    const keringData = {
        elNino: kabData.globalAnomaliesDry?.elNino || 0,
        iodPositif: kabData.globalAnomaliesDry?.iodPositif || 0,
        hthKering: state.hthData.resultsKabupaten?.[kab]?.hth_kering || 0,
        musimKemarau: kabData.seasonToggles?.musimKemarau || 0,
        chBulananRendah: state.chshMonthly.resultsKabupaten?.[kab]?.ch_bulanan_rendah || 0,
        shBulananBN: state.chshMonthly.resultsKabupaten?.[kab]?.sh_bulanan_BN || 0,
        chDasarianRendah: state.chshDasarian.resultsKabupaten?.[kab]?.ch_bulanan_rendah || 0,
        shDasarianBN: state.chshDasarian.resultsKabupaten?.[kab]?.sh_bulanan_BN || 0,
        pdkm: kabData.pdkm?.pdkm || 0,
        elNinoBerlanjut: kabData.globalAnomaliesDry?.elNinoBerlanjut || 0,
        iodPositifBerlanjut: kabData.globalAnomaliesDry?.iodPositifBerlanjut || 0,
        bulanPlus1Kemarau: kabData.seasonToggles?.bulanPlus1MusimKemarau || 0,
        chPlus1Rendah: state.chshPredictionPlus1.resultsKabupaten?.[kab]?.ch_bulanan_rendah || 0,
        shPlus1BN: state.chshPredictionPlus1.resultsKabupaten?.[kab]?.sh_bulanan_BN || 0,
        chPlus2Rendah: state.chshPredictionPlus2.resultsKabupaten?.[kab]?.ch_bulanan_rendah || 0,
        shPlus2BN: state.chshPredictionPlus2.resultsKabupaten?.[kab]?.sh_bulanan_BN || 0,
        chPlus3Rendah: state.chshPredictionPlus3.resultsKabupaten?.[kab]?.ch_bulanan_rendah || 0,
        shPlus3BN: state.chshPredictionPlus3.resultsKabupaten?.[kab]?.sh_bulanan_BN || 0,
    };

    const basahData = {
        laNina: kabData.globalAnomaliesWet?.laNina || 0,
        iodNegatif: kabData.globalAnomaliesWet?.iodNegatif || 0,
        hthBasah: state.hthData.resultsKabupaten?.[kab]?.hth_basah || 0,
        musimHujan: kabData.seasonToggles?.musimHujan || 0,
        chBulananTinggi: state.chshMonthly.resultsKabupaten?.[kab]?.ch_bulanan_tinggi || 0,
        shBulananAN: state.chshMonthly.resultsKabupaten?.[kab]?.sh_bulanan_AN || 0,
        chDasarianTinggi: state.chshDasarian.resultsKabupaten?.[kab]?.ch_bulanan_tinggi || 0,
        shDasarianAN: state.chshDasarian.resultsKabupaten?.[kab]?.sh_bulanan_AN || 0,
        pdcht: kabData.pdkm?.pdcht || 0,
        laNinaBerlanjut: kabData.globalAnomaliesWet?.laNinaBerlanjut || 0,
        iodNegatifBerlanjut: kabData.globalAnomaliesWet?.iodNegatifBerlanjut || 0,
        bulanPlus1Hujan: kabData.seasonToggles?.bulanPlus1MusimHujan || 0,
        chPlus1Tinggi: state.chshPredictionPlus1.resultsKabupaten?.[kab]?.ch_bulanan_tinggi || 0,
        shPlus1AN: state.chshPredictionPlus1.resultsKabupaten?.[kab]?.sh_bulanan_AN || 0,
        chPlus2Tinggi: state.chshPredictionPlus2.resultsKabupaten?.[kab]?.ch_bulanan_tinggi || 0,
        shPlus2AN: state.chshPredictionPlus2.resultsKabupaten?.[kab]?.sh_bulanan_AN || 0,
        chPlus3Tinggi: state.chshPredictionPlus3.resultsKabupaten?.[kab]?.ch_bulanan_tinggi || 0,
        shPlus3AN: state.chshPredictionPlus3.resultsKabupaten?.[kab]?.sh_bulanan_AN || 0,
    };

    const keringTotal = Object.values(keringData).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const basahTotal = Object.values(basahData).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const keringClass = getKeringClassification(keringTotal);
    const basahClass = getBasahClassification(basahTotal);
    const combinedClass = getCombinedClassification(keringClass.kelas, basahClass.kelas);

    return {
        name: kab,
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
};

const collectKecamatanData = (state: any, kec: string) => {
    const kecData = state.kecamatanData[kec];
    if (!kecData) return null;

    // Get kabupaten name from kecamatan key (e.g., "Sleman_Gamping" -> "Sleman")
    const kabName = kec.split('_')[0];
    // Get PDKM data from parent kabupaten
    const kabPdkmData = state.kabupatenData[kabName]?.pdkm || { pdkm: 0, pdcht: 0 };

    const keringData = {
        elNino: kecData.globalAnomaliesDry?.elNino || 0,
        iodPositif: kecData.globalAnomaliesDry?.iodPositif || 0,
        hthKering: state.hthData.resultsKecamatan?.[kec]?.hth_kering || 0,
        musimKemarau: kecData.seasonToggles?.musimKemarau || 0,
        chBulananRendah: state.chshMonthly.resultsKecamatan?.[kec]?.ch_bulanan_rendah || 0,
        shBulananBN: state.chshMonthly.resultsKecamatan?.[kec]?.sh_bulanan_BN || 0,
        chDasarianRendah: state.chshDasarian.resultsKecamatan?.[kec]?.ch_bulanan_rendah || 0,
        shDasarianBN: state.chshDasarian.resultsKecamatan?.[kec]?.sh_bulanan_BN || 0,
        pdkm: kabPdkmData.pdkm || 0,
        elNinoBerlanjut: kecData.globalAnomaliesDry?.elNinoBerlanjut || 0,
        iodPositifBerlanjut: kecData.globalAnomaliesDry?.iodPositifBerlanjut || 0,
        bulanPlus1Kemarau: kecData.seasonToggles?.bulanPlus1MusimKemarau || 0,
        chPlus1Rendah: state.chshPredictionPlus1.resultsKecamatan?.[kec]?.ch_bulanan_rendah || 0,
        shPlus1BN: state.chshPredictionPlus1.resultsKecamatan?.[kec]?.sh_bulanan_BN || 0,
        chPlus2Rendah: state.chshPredictionPlus2.resultsKecamatan?.[kec]?.ch_bulanan_rendah || 0,
        shPlus2BN: state.chshPredictionPlus2.resultsKecamatan?.[kec]?.sh_bulanan_BN || 0,
        chPlus3Rendah: state.chshPredictionPlus3.resultsKecamatan?.[kec]?.ch_bulanan_rendah || 0,
        shPlus3BN: state.chshPredictionPlus3.resultsKecamatan?.[kec]?.sh_bulanan_BN || 0,
    };

    const basahData = {
        laNina: kecData.globalAnomaliesWet?.laNina || 0,
        iodNegatif: kecData.globalAnomaliesWet?.iodNegatif || 0,
        hthBasah: state.hthData.resultsKecamatan?.[kec]?.hth_basah || 0,
        musimHujan: kecData.seasonToggles?.musimHujan || 0,
        chBulananTinggi: state.chshMonthly.resultsKecamatan?.[kec]?.ch_bulanan_tinggi || 0,
        shBulananAN: state.chshMonthly.resultsKecamatan?.[kec]?.sh_bulanan_AN || 0,
        chDasarianTinggi: state.chshDasarian.resultsKecamatan?.[kec]?.ch_bulanan_tinggi || 0,
        shDasarianAN: state.chshDasarian.resultsKecamatan?.[kec]?.sh_bulanan_AN || 0,
        pdcht: kabPdkmData.pdcht || 0,
        laNinaBerlanjut: kecData.globalAnomaliesWet?.laNinaBerlanjut || 0,
        iodNegatifBerlanjut: kecData.globalAnomaliesWet?.iodNegatifBerlanjut || 0,
        bulanPlus1Hujan: kecData.seasonToggles?.bulanPlus1MusimHujan || 0,
        chPlus1Tinggi: state.chshPredictionPlus1.resultsKecamatan?.[kec]?.ch_bulanan_tinggi || 0,
        shPlus1AN: state.chshPredictionPlus1.resultsKecamatan?.[kec]?.sh_bulanan_AN || 0,
        chPlus2Tinggi: state.chshPredictionPlus2.resultsKecamatan?.[kec]?.ch_bulanan_tinggi || 0,
        shPlus2AN: state.chshPredictionPlus2.resultsKecamatan?.[kec]?.sh_bulanan_AN || 0,
        chPlus3Tinggi: state.chshPredictionPlus3.resultsKecamatan?.[kec]?.ch_bulanan_tinggi || 0,
        shPlus3AN: state.chshPredictionPlus3.resultsKecamatan?.[kec]?.sh_bulanan_AN || 0,
    };

    const keringTotal = Object.values(keringData).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const basahTotal = Object.values(basahData).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const keringClass = getKeringClassification(keringTotal);
    const basahClass = getBasahClassification(basahTotal);
    const combinedClass = getCombinedClassification(keringClass.kelas, basahClass.kelas);

    const kecName = getKecamatanFromKey(kec);

    return {
        name: kecName,
        kabupaten: kabName,
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
};

// Create a single workbook for a level (Kabupaten or Kecamatan)
const createWorkbook = async (
    allData: any[],
    levelName: string,
    regionColumn: string,
    isKecamatan: boolean = false
): Promise<ExcelJS.Workbook> => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SKPG Tools';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Data SKPG', {
        views: [{ state: 'frozen', xSplit: isKecamatan ? 4 : 3, ySplit: 6 }]
    });

    // Column widths
    const baseColumns = [
        { width: 4 },   // A: No
        { width: 5 },   // B: Prov
    ];
    
    if (isKecamatan) {
        baseColumns.push({ width: 18 }); // C: Kab (only for Kecamatan)
    }
    
    baseColumns.push({ width: 18 }); // C or D: Kec/Kab
    
    ws.columns = [
        ...baseColumns,
        // Kering Section
        { width: 10 }, { width: 10 }, { width: 6 }, { width: 12 },
        { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
        { width: 10 }, { width: 12 }, { width: 12 }, { width: 12 },
        { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
        // Ringkasan Kering
        { width: 10 }, { width: 8 }, { width: 12 },
        // Basah Section
        { width: 10 }, { width: 10 }, { width: 8 }, { width: 12 },
        { width: 16 }, { width: 14 }, { width: 16 }, { width: 14 },
        { width: 10 }, { width: 12 }, { width: 12 }, { width: 12 },
        { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
        // Ringkasan Basah
        { width: 10 }, { width: 8 }, { width: 12 },
        // Ringkasan Kombinasi
        { width: 12 }, { width: 12 },
    ];

    // Row 1: Title
    ws.getRow(1).height = 23;
    const titleMergeCell = isKecamatan ? 'A1:AV1' : 'A1:AU1';
    ws.mergeCells(titleMergeCell);
    const titleCell = ws.getCell('A1');
    titleCell.value = `Identifikasi Anomali Iklim - Level ${levelName}`;
    titleCell.font = { name: 'Calibri', bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 2: Score explanation
    ws.getRow(2).height = 18;
    const scoreMergeCell = isKecamatan ? 'A2:AV2' : 'A2:AU2';
    ws.mergeCells(scoreMergeCell);
    const scoreCell = ws.getCell('A2');
    scoreCell.value = 'Jika iya skor = 1 dan jika tidak skor = 0';
    scoreCell.font = { name: 'Calibri', italic: true, size: 10 };
    scoreCell.alignment = { horizontal: 'left', vertical: 'middle' };

    // Row 3: Empty
    ws.getRow(3).height = 8;

    // Row 4: Main Category Headers
    ws.getRow(4).height = 25;

    ws.mergeCells('A4:A6');
    ws.mergeCells('B4:B6');
    applyHeaderStyle(ws.getCell('A4'), COLORS.white);
    applyHeaderStyle(ws.getCell('B4'), COLORS.white);
    ws.getCell('A4').value = 'No';
    ws.getCell('B4').value = 'Prov';
    
    if (isKecamatan) {
        ws.mergeCells('C4:C6');
        applyHeaderStyle(ws.getCell('C4'), COLORS.white);
        ws.getCell('C4').value = 'Kab';
        ws.mergeCells('D4:D6');
        applyHeaderStyle(ws.getCell('D4'), COLORS.white);
        ws.getCell('D4').value = regionColumn;
        
        ws.mergeCells('E4:V4');
        applyHeaderStyle(ws.getCell('E4'), COLORS.keringDefault, true, 11);
        ws.getCell('E4').value = 'Anomali Iklim yang Berpotensi Mengakibatkan Kondisi Lebih Kering';

        ws.mergeCells('W4:Y5');
        applyHeaderStyle(ws.getCell('W4'), COLORS.keringDefault);
        ws.getCell('W4').value = 'Ringkasan Potensi Kering';

        ws.mergeCells('Z4:AQ4');
        applyHeaderStyle(ws.getCell('Z4'), COLORS.basahDefault, true, 11);
        ws.getCell('Z4').value = 'Anomali Iklim yang Berpotensi Mengakibatkan Kondisi Lebih Basah';

        ws.mergeCells('AR4:AT5');
        applyHeaderStyle(ws.getCell('AR4'), COLORS.basahDefault);
        ws.getCell('AR4').value = 'Ringkasan Potensi Basah';

        ws.mergeCells('AU4:AV5');
        applyHeaderStyle(ws.getCell('AU4'), COLORS.ringkasanKombinasi);
        ws.getCell('AU4').value = 'Ringkasan Potensi Anomali Iklim';
    } else {
        ws.mergeCells('C4:C6');
        applyHeaderStyle(ws.getCell('C4'), COLORS.white);
        ws.getCell('C4').value = regionColumn;

        ws.mergeCells('D4:U4');
        applyHeaderStyle(ws.getCell('D4'), COLORS.keringDefault, true, 11);
        ws.getCell('D4').value = 'Anomali Iklim yang Berpotensi Mengakibatkan Kondisi Lebih Kering';

        ws.mergeCells('V4:X5');
        applyHeaderStyle(ws.getCell('V4'), COLORS.keringDefault);
        ws.getCell('V4').value = 'Ringkasan Potensi Kering';

        ws.mergeCells('Y4:AP4');
        applyHeaderStyle(ws.getCell('Y4'), COLORS.basahDefault, true, 11);
        ws.getCell('Y4').value = 'Anomali Iklim yang Berpotensi Mengakibatkan Kondisi Lebih Basah';

        ws.mergeCells('AQ4:AS5');
        applyHeaderStyle(ws.getCell('AQ4'), COLORS.basahDefault);
        ws.getCell('AQ4').value = 'Ringkasan Potensi Basah';

        ws.mergeCells('AT4:AU5');
        applyHeaderStyle(ws.getCell('AT4'), COLORS.ringkasanKombinasi);
        ws.getCell('AT4').value = 'Ringkasan Potensi Anomali Iklim';
    }

    // Row 5: Sub-category Headers
    ws.getRow(5).height = 20;

    if (isKecamatan) {
        ws.mergeCells('E5:F5');
        applyHeaderStyle(ws.getCell('E5'), COLORS.keringDefault);
        ws.getCell('E5').value = 'Anomali Iklim Global';

        ws.mergeCells('G5:M5');
        applyHeaderStyle(ws.getCell('G5'), COLORS.keringDefault);
        ws.getCell('G5').value = 'Monitoring Iklim Regional';

        ws.mergeCells('N5:V5');
        applyHeaderStyle(ws.getCell('N5'), COLORS.keringDefault);
        ws.getCell('N5').value = 'Prediksi Iklim Hingga Tiga Bulan Ke Depan';

        ws.mergeCells('Z5:AA5');
        applyHeaderStyle(ws.getCell('Z5'), COLORS.basahDefault);
        ws.getCell('Z5').value = 'Anomali Iklim Global';

        ws.mergeCells('AB5:AH5');
        applyHeaderStyle(ws.getCell('AB5'), COLORS.basahDefault);
        ws.getCell('AB5').value = 'Monitoring Iklim Regional';

        ws.mergeCells('AI5:AQ5');
        applyHeaderStyle(ws.getCell('AI5'), COLORS.basahDefault);
        ws.getCell('AI5').value = 'Prediksi Iklim Hingga Tiga Bulan Ke Depan';
    } else {
        ws.mergeCells('D5:E5');
        applyHeaderStyle(ws.getCell('D5'), COLORS.keringDefault);
        ws.getCell('D5').value = 'Anomali Iklim Global';

        ws.mergeCells('F5:L5');
        applyHeaderStyle(ws.getCell('F5'), COLORS.keringDefault);
        ws.getCell('F5').value = 'Monitoring Iklim Regional';

        ws.mergeCells('M5:U5');
        applyHeaderStyle(ws.getCell('M5'), COLORS.keringDefault);
        ws.getCell('M5').value = 'Prediksi Iklim Hingga Tiga Bulan Ke Depan';

        ws.mergeCells('Y5:Z5');
        applyHeaderStyle(ws.getCell('Y5'), COLORS.basahDefault);
        ws.getCell('Y5').value = 'Anomali Iklim Global';

        ws.mergeCells('AA5:AG5');
        applyHeaderStyle(ws.getCell('AA5'), COLORS.basahDefault);
        ws.getCell('AA5').value = 'Monitoring Iklim Regional';

        ws.mergeCells('AH5:AP5');
        applyHeaderStyle(ws.getCell('AH5'), COLORS.basahDefault);
        ws.getCell('AH5').value = 'Prediksi Iklim Hingga Tiga Bulan Ke Depan';
    }

    // Row 6: Column Headers
    ws.getRow(6).height = 45;

    // Base column config for data columns (starting from column D for Kab, E for Kec)
    const baseColumnConfig = [
        { header: 'El Nino', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'IOD Positif', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'HTH', headerColor: COLORS.hthKeringPdkm, dataColor: COLORS.hthKeringPdkm },
        { header: 'Musim Kemarau', headerColor: COLORS.musimKemarau, dataColor: COLORS.white },
        { header: 'Curah Hujan Bulanan Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'Sifat Hujan Bulanan BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'Curah Hujan Dasarian Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'Sifat Hujan Dasarian BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'Ada PDKM', headerColor: COLORS.hthKeringPdkm, dataColor: COLORS.hthKeringPdkm },
        { header: 'El Nino Berlanjut', headerColor: COLORS.keringDefault, dataColor: COLORS.keringDefault },
        { header: 'IOD+ Berlanjut', headerColor: COLORS.keringDefault, dataColor: COLORS.keringDefault },
        { header: 'Bulan+1 Kemarau', headerColor: COLORS.musimKemarau, dataColor: COLORS.white },
        { header: 'CH Bulan+1 Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'SH Bulan+1 BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'CH Bulan+2 Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'SH Bulan+2 BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'CH Bulan+3 Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'SH Bulan+3 BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'Total Skor', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'Kelas', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'Kategori', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
        { header: 'La Nina', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'IOD Negatif', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'HTH Basah', headerColor: COLORS.hthBasahPdcht, dataColor: COLORS.hthBasahPdcht },
        { header: 'Musim Hujan', headerColor: COLORS.musimHujan, dataColor: COLORS.white },
        { header: 'CH Bulanan Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'SH Bulanan AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'CH Dasarian Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'SH Dasarian AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'Ada PDCHT', headerColor: COLORS.hthBasahPdcht, dataColor: COLORS.hthBasahPdcht },
        { header: 'La Nina Berlanjut', headerColor: COLORS.basahDefault, dataColor: COLORS.basahDefault },
        { header: 'IOD- Berlanjut', headerColor: COLORS.basahDefault, dataColor: COLORS.basahDefault },
        { header: 'Bulan+1 Hujan', headerColor: COLORS.musimHujan, dataColor: COLORS.white },
        { header: 'CH Bulan+1 Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'SH Bulan+1 AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'CH Bulan+2 Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'SH Bulan+2 AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'CH Bulan+3 Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'SH Bulan+3 AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'Total Skor', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'Kelas', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'Kategori', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
        { header: 'Kombinasi Kelas', headerColor: COLORS.ringkasanKombinasi, dataColor: COLORS.ringkasanKombinasi },
        { header: 'Kategori', headerColor: COLORS.ringkasanKombinasi, dataColor: COLORS.white },
    ];

    const startCol = isKecamatan ? 5 : 4; // Start from column E for Kecamatan, D for Kabupaten
    baseColumnConfig.forEach((config, idx) => {
        const col = startCol + idx;
        const cell = ws.getCell(6, col);
        cell.value = config.header;
        applyHeaderStyle(cell, config.headerColor);
    });
    
    // Create columnConfig mapping for data rows
    const columnConfig: Record<number, { header: string; headerColor: string; dataColor: string }> = {};
    baseColumnConfig.forEach((config, idx) => {
        columnConfig[startCol + idx] = config;
    });

    // Data rows
    allData.forEach((row, idx) => {
        if (!row) return;
        const rowNum = idx + 7;
        const excelRow = ws.getRow(rowNum);
        excelRow.height = 18;

        const baseValues = [
            idx + 1, 'DIY'
        ];
        
        if (isKecamatan) {
            baseValues.push(row.kabupaten); // Add Kabupaten column for Kecamatan
        }
        
        baseValues.push(row.name); // Kab or Kec name
        
        const dataValues = [
            row.kering.elNino, row.kering.iodPositif, row.kering.hthKering, row.kering.musimKemarau,
            row.kering.chBulananRendah, row.kering.shBulananBN, row.kering.chDasarianRendah, row.kering.shDasarianBN,
            row.kering.pdkm, row.kering.elNinoBerlanjut, row.kering.iodPositifBerlanjut, row.kering.bulanPlus1Kemarau,
            row.kering.chPlus1Rendah, row.kering.shPlus1BN, row.kering.chPlus2Rendah, row.kering.shPlus2BN,
            row.kering.chPlus3Rendah, row.kering.shPlus3BN,
            row.keringTotal, row.keringKelas, row.keringKategori,
            row.basah.laNina, row.basah.iodNegatif, row.basah.hthBasah, row.basah.musimHujan,
            row.basah.chBulananTinggi, row.basah.shBulananAN, row.basah.chDasarianTinggi, row.basah.shDasarianAN,
            row.basah.pdcht, row.basah.laNinaBerlanjut, row.basah.iodNegatifBerlanjut, row.basah.bulanPlus1Hujan,
            row.basah.chPlus1Tinggi, row.basah.shPlus1AN, row.basah.chPlus2Tinggi, row.basah.shPlus2AN,
            row.basah.chPlus3Tinggi, row.basah.shPlus3AN,
            row.basahTotal, row.basahKelas, row.basahKategori,
            row.combinedKelas, row.combinedKategori,
        ];

        const values = [...baseValues, ...dataValues];

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

    const ringkasanColumns = [
        { width: 4 },   // A: No
        { width: 8 },   // B: Provinsi
    ];
    
    if (isKecamatan) {
        ringkasanColumns.push({ width: 18 }); // C: Kabupaten (only for Kecamatan)
    }
    
    ringkasanColumns.push(
        { width: 18 },  // C or D: Kabupaten/Kecamatan
        { width: 8 },   // D or E: Skor Kering
        { width: 8 },   // E or F: Kelas Kering
        { width: 12 },  // F or G: Kategori Kering
        { width: 8 },   // G or H: Skor Basah
        { width: 8 },   // H or I: Kelas Basah
        { width: 12 },  // I or J: Kategori Basah
        { width: 14 },  // J or K: Kombinasi Kelas
        { width: 12 },  // K or L: Kategori
    );

    wsRingkasan.columns = ringkasanColumns;

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const currentMonth = months[new Date().getMonth()];
    const currentYear = new Date().getFullYear();

    // Row 1: Main Title
    wsRingkasan.getRow(1).height = 20;
    const ringkasanTitleMerge = isKecamatan ? 'A1:L1' : 'A1:K1';
    wsRingkasan.mergeCells(ringkasanTitleMerge);
    const ringkasanTitle = wsRingkasan.getCell('A1');
    ringkasanTitle.value = `Ringkasan Identifikasi Anomali Iklim - Level ${levelName}`;
    ringkasanTitle.font = { name: 'Calibri', bold: true, size: 12 };
    ringkasanTitle.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 2: Update date
    const ringkasanDateMerge = isKecamatan ? 'A2:L2' : 'A2:K2';
    wsRingkasan.mergeCells(ringkasanDateMerge);
    const updateDate = wsRingkasan.getCell('A2');
    updateDate.value = `Update ${currentMonth} ${currentYear}`;
    updateDate.font = { name: 'Calibri', bold: true, size: 11 };
    updateDate.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 3: Empty
    wsRingkasan.getRow(3).height = 8;

    // Row 4: Main category headers
    wsRingkasan.getRow(4).height = 20;

    wsRingkasan.mergeCells('A4:A5');
    wsRingkasan.mergeCells('B4:B5');
    applyHeaderStyle(wsRingkasan.getCell('A4'), COLORS.white);
    applyHeaderStyle(wsRingkasan.getCell('B4'), COLORS.white);
    wsRingkasan.getCell('A4').value = 'No';
    wsRingkasan.getCell('B4').value = 'Provinsi';
    
    if (isKecamatan) {
        wsRingkasan.mergeCells('C4:C5');
        applyHeaderStyle(wsRingkasan.getCell('C4'), COLORS.white);
        wsRingkasan.getCell('C4').value = 'Kab';
        
        wsRingkasan.mergeCells('D4:D5');
        applyHeaderStyle(wsRingkasan.getCell('D4'), COLORS.white);
        wsRingkasan.getCell('D4').value = regionColumn;

        wsRingkasan.mergeCells('E4:G4');
        applyHeaderStyle(wsRingkasan.getCell('E4'), COLORS.keringDefault);
        wsRingkasan.getCell('E4').value = 'Ringkasan Potensi Kering';

        wsRingkasan.mergeCells('H4:J4');
        applyHeaderStyle(wsRingkasan.getCell('H4'), COLORS.basahDefault);
        wsRingkasan.getCell('H4').value = 'Ringkasan Potensi Basah';

        wsRingkasan.mergeCells('K4:L4');
        applyHeaderStyle(wsRingkasan.getCell('K4'), COLORS.ringkasanKombinasi);
        wsRingkasan.getCell('K4').value = 'Ringkasan Kondisi Iklim';
    } else {
        wsRingkasan.mergeCells('C4:C5');
        applyHeaderStyle(wsRingkasan.getCell('C4'), COLORS.white);
        wsRingkasan.getCell('C4').value = regionColumn;

        wsRingkasan.mergeCells('D4:F4');
        applyHeaderStyle(wsRingkasan.getCell('D4'), COLORS.keringDefault);
        wsRingkasan.getCell('D4').value = 'Ringkasan Potensi Kering';

        wsRingkasan.mergeCells('G4:I4');
        applyHeaderStyle(wsRingkasan.getCell('G4'), COLORS.basahDefault);
        wsRingkasan.getCell('G4').value = 'Ringkasan Potensi Basah';

        wsRingkasan.mergeCells('J4:K4');
        applyHeaderStyle(wsRingkasan.getCell('J4'), COLORS.ringkasanKombinasi);
        wsRingkasan.getCell('J4').value = 'Ringkasan Kondisi Iklim';
    }

    // Row 5: Sub-headers
    wsRingkasan.getRow(5).height = 20;

    if (isKecamatan) {
        applyHeaderStyle(wsRingkasan.getCell('E5'), COLORS.keringDefault);
        wsRingkasan.getCell('E5').value = 'Skor';
        applyHeaderStyle(wsRingkasan.getCell('F5'), COLORS.keringDefault);
        wsRingkasan.getCell('F5').value = 'Kelas';
        applyHeaderStyle(wsRingkasan.getCell('G5'), COLORS.keringDefault);
        wsRingkasan.getCell('G5').value = 'Kategori';

        applyHeaderStyle(wsRingkasan.getCell('H5'), COLORS.basahDefault);
        wsRingkasan.getCell('H5').value = 'Skor';
        applyHeaderStyle(wsRingkasan.getCell('I5'), COLORS.basahDefault);
        wsRingkasan.getCell('I5').value = 'Kelas';
        applyHeaderStyle(wsRingkasan.getCell('J5'), COLORS.basahDefault);
        wsRingkasan.getCell('J5').value = 'Kategori';

        applyHeaderStyle(wsRingkasan.getCell('K5'), COLORS.ringkasanKombinasi);
        wsRingkasan.getCell('K5').value = 'Kombinasi Kelas';
        applyHeaderStyle(wsRingkasan.getCell('L5'), COLORS.ringkasanKombinasi);
        wsRingkasan.getCell('L5').value = 'Kategori';
    } else {
        applyHeaderStyle(wsRingkasan.getCell('D5'), COLORS.keringDefault);
        wsRingkasan.getCell('D5').value = 'Skor';
        applyHeaderStyle(wsRingkasan.getCell('E5'), COLORS.keringDefault);
        wsRingkasan.getCell('E5').value = 'Kelas';
        applyHeaderStyle(wsRingkasan.getCell('F5'), COLORS.keringDefault);
        wsRingkasan.getCell('F5').value = 'Kategori';

        applyHeaderStyle(wsRingkasan.getCell('G5'), COLORS.basahDefault);
        wsRingkasan.getCell('G5').value = 'Skor';
        applyHeaderStyle(wsRingkasan.getCell('H5'), COLORS.basahDefault);
        wsRingkasan.getCell('H5').value = 'Kelas';
        applyHeaderStyle(wsRingkasan.getCell('I5'), COLORS.basahDefault);
        wsRingkasan.getCell('I5').value = 'Kategori';

        applyHeaderStyle(wsRingkasan.getCell('J5'), COLORS.ringkasanKombinasi);
        wsRingkasan.getCell('J5').value = 'Kombinasi Kelas';
        applyHeaderStyle(wsRingkasan.getCell('K5'), COLORS.ringkasanKombinasi);
        wsRingkasan.getCell('K5').value = 'Kategori';
    }

    // Data rows for Ringkasan
    allData.forEach((row, idx) => {
        if (!row) return;
        const rowNum = idx + 6;
        const excelRow = wsRingkasan.getRow(rowNum);
        excelRow.height = 18;

        const baseRingkasanValues = [
            idx + 1,           // A: No
            'DIY',             // B: Provinsi
        ];
        
        if (isKecamatan) {
            baseRingkasanValues.push(row.kabupaten); // C: Kabupaten (only for Kecamatan)
        }
        
        baseRingkasanValues.push(row.name); // C or D: Kab/Kec
        
        const ringkasanDataValues = [
            row.keringTotal,      // Skor Kering
            row.keringKelas,      // Kelas Kering
            row.keringKategori,   // Kategori Kering
            row.basahTotal,       // Skor Basah
            row.basahKelas,       // Kelas Basah
            row.basahKategori,    // Kategori Basah
            row.combinedKelas,    // Kombinasi Kelas
            row.combinedKategori, // Kategori
        ];

        const values = [...baseRingkasanValues, ...ringkasanDataValues];

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
    wsKeterangan.addRow(['Keterangan untuk Ringkasan Kondisi Iklim']);
    wsKeterangan.addRow(['Kelas', 'Kategori', 'Syarat Kombinasi', 'Layer', 'Warna']);
    wsKeterangan.addRow([0, 'Aman', 'kering & basah keduanya = aman', 'polos', 'Hijau']);
    wsKeterangan.addRow([1, 'Waspada', 'salah satu = waspada', 'ooo', 'Kuning']);
    wsKeterangan.addRow([2, 'Siaga', 'salah satu = siaga atau keduanya = waspada', '+++', 'Orange']);
    wsKeterangan.addRow([3, 'Awas', 'salah satu = awas atau keduanya = siaga', 'XXX', 'Merah']);

    wsKeterangan.addRow([]);
    wsKeterangan.addRow(['Keterangan:']);
    wsKeterangan.addRow(['Bulan+1 Musim Hujan bergantian dengan Bulan+1 Musim Kemarau']);
    wsKeterangan.addRow(['IOD Positif Bergantian dengan IOD Negatif']);
    wsKeterangan.addRow(['El Nino bergantian dengan La Nina']);

    wsKeterangan.addRow([]);
    wsKeterangan.addRow(['Tabel Kombinasi Kelas']);
    wsKeterangan.addRow(['Kelas', 'Kategori']);

    const kombinasiTable = [
        ['00', 'Aman'], ['01', 'Waspada'], ['02', 'Siaga'], ['03', 'Awas'],
        ['10', 'Waspada'], ['11', 'Siaga'], ['12', 'Siaga'], ['13', 'Awas'],
        ['20', 'Siaga'], ['21', 'Siaga'], ['22', 'Awas'], ['23', 'Awas'],
        ['30', 'Awas'], ['31', 'Awas'], ['32', 'Awas'], ['33', 'Awas'],
    ];

    kombinasiTable.forEach((item) => {
        wsKeterangan.addRow([item[0], item[1]]);
    });

    return workbook;
};

export const exportCombinedToExcel = async () => {
    const state = useCombinedStore.getState();
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    toast({ title: 'Memulai Export...', description: 'Membuat 2 file Excel' });

    // Collect Kabupaten data
    const kabupatenData = KABUPATEN_LIST.map(kab => collectKabupatenData(state, kab)).filter(Boolean);
    const wbKabupaten = await createWorkbook(kabupatenData, 'Kabupaten', 'Kab', false);
    const bufferKab = await wbKabupaten.xlsx.writeBuffer();
    const blobKab = new Blob([bufferKab], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blobKab, `SKPG_Kabupaten_${timestamp}.xlsx`);

    // Collect Kecamatan data
    const kecamatanData = KECAMATAN_LIST.map(kec => collectKecamatanData(state, kec)).filter(Boolean);
    const wbKecamatan = await createWorkbook(kecamatanData, 'Kecamatan', 'Kec', true);
    const bufferKec = await wbKecamatan.xlsx.writeBuffer();
    const blobKec = new Blob([bufferKec], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blobKec, `SKPG_Kecamatan_${timestamp}.xlsx`);

    toast({ title: 'Export Selesai ✅', description: '2 file berhasil diunduh' });
};
