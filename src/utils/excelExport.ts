import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useWizardStore, KABUPATEN_LIST } from '@/store/wizardStore';

// Exact color definitions from user (ARGB format)
const COLORS = {
  // Main section colors
  keringDefault: 'FFFFFF00',    // Yellow #FFFF00 - default for Kering section
  basahDefault: 'FFDAEEF3',     // Light blue #DAEEF3 - default for Basah section

  // Special columns - applied to ENTIRE column (header + data)
  hthKeringPdkm: 'FFED7D31',    // Orange #ED7D31 - HTH Kering & Ada PDKM
  hthBasahPdcht: 'FF00B050',    // Dark green #00B050 - HTH Basah & Ada PDCHT

  // Special headers only (not data cells)
  musimKemarau: 'FFFFC000',     // Orange #FFC000 - Musim Kemarau & Bulan+1 Kemarau headers
  musimHujan: 'FF66FF99',       // Bright green #66FF99 - Musim Hujan & Bulan+1 Hujan headers

  // Ringkasan Kombinasi
  ringkasanKombinasi: 'FFFFCCFF', // Light pink #FFCCFF

  // Other
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

// Combined classification
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

// Apply cell styling with Calibri font
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

export const exportToExcel = async () => {
  const state = useWizardStore.getState();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SKPG Tools';
  workbook.created = new Date();

  // Collect data for all kabupaten
  const allData = KABUPATEN_LIST.map((kab) => {
    const kabData = state.kabupatenData[kab];

    const keringData = {
      elNino: kabData.globalAnomaliesDry.elNino || 0,
      iodPositif: kabData.globalAnomaliesDry.iodPositif || 0,
      hthKering: state.hthData.results?.[kab]?.hth_kering || 0,
      musimKemarau: kabData.seasonToggles.musimKemarau || 0,
      chBulananRendah: state.chshMonthly.results?.[kab]?.ch_bulanan_rendah || 0,
      shBulananBN: state.chshMonthly.results?.[kab]?.sh_bulanan_BN || 0,
      chDasarianRendah: state.chshDasarian.results?.[kab]?.ch_bulanan_rendah || 0,
      shDasarianBN: state.chshDasarian.results?.[kab]?.sh_bulanan_BN || 0,
      pdkm: kabData.pdkm.pdkm || 0,
      elNinoBerlanjut: kabData.globalAnomaliesDry.elNinoBerlanjut || 0,
      iodPositifBerlanjut: kabData.globalAnomaliesDry.iodPositifBerlanjut || 0,
      bulanPlus1Kemarau: kabData.seasonToggles.bulanPlus1MusimKemarau || 0,
      chPlus1Rendah: state.chshPredictionPlus1.results?.[kab]?.ch_bulanan_rendah || 0,
      shPlus1BN: state.chshPredictionPlus1.results?.[kab]?.sh_bulanan_BN || 0,
      chPlus2Rendah: state.chshPredictionPlus2.results?.[kab]?.ch_bulanan_rendah || 0,
      shPlus2BN: state.chshPredictionPlus2.results?.[kab]?.sh_bulanan_BN || 0,
      chPlus3Rendah: state.chshPredictionPlus3.results?.[kab]?.ch_bulanan_rendah || 0,
      shPlus3BN: state.chshPredictionPlus3.results?.[kab]?.sh_bulanan_BN || 0,
    };

    const basahData = {
      laNina: kabData.globalAnomaliesWet.laNina || 0,
      iodNegatif: kabData.globalAnomaliesWet.iodNegatif || 0,
      hthBasah: state.hthData.results?.[kab]?.hth_basah || 0,
      musimHujan: kabData.seasonToggles.musimHujan || 0,
      chBulananTinggi: state.chshMonthly.results?.[kab]?.ch_bulanan_tinggi || 0,
      shBulananAN: state.chshMonthly.results?.[kab]?.sh_bulanan_AN || 0,
      chDasarianTinggi: state.chshDasarian.results?.[kab]?.ch_bulanan_tinggi || 0,
      shDasarianAN: state.chshDasarian.results?.[kab]?.sh_bulanan_AN || 0,
      pdcht: kabData.pdkm.pdcht || 0,
      laNinaBerlanjut: kabData.globalAnomaliesWet.laNinaBerlanjut || 0,
      iodNegatifBerlanjut: kabData.globalAnomaliesWet.iodNegatifBerlanjut || 0,
      bulanPlus1Hujan: kabData.seasonToggles.bulanPlus1MusimHujan || 0,
      chPlus1Tinggi: state.chshPredictionPlus1.results?.[kab]?.ch_bulanan_tinggi || 0,
      shPlus1AN: state.chshPredictionPlus1.results?.[kab]?.sh_bulanan_AN || 0,
      chPlus2Tinggi: state.chshPredictionPlus2.results?.[kab]?.ch_bulanan_tinggi || 0,
      shPlus2AN: state.chshPredictionPlus2.results?.[kab]?.sh_bulanan_AN || 0,
      chPlus3Tinggi: state.chshPredictionPlus3.results?.[kab]?.ch_bulanan_tinggi || 0,
      shPlus3AN: state.chshPredictionPlus3.results?.[kab]?.sh_bulanan_AN || 0,
    };

    const keringTotal = Object.values(keringData).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const basahTotal = Object.values(basahData).reduce((sum, val) => sum + (Number(val) || 0), 0);

    const keringClass = getKeringClassification(keringTotal);
    const basahClass = getBasahClassification(basahTotal);
    const combinedClass = getCombinedClassification(keringClass.kelas, basahClass.kelas);

    return {
      kabupaten: kab,
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

  // ========== MAIN SHEET: ALL DATA IN ONE ==========
  const ws = workbook.addWorksheet('Data SKPG', {
    views: [{ state: 'frozen', xSplit: 3, ySplit: 6 }]
  });

  // Column widths
  ws.columns = [
    { width: 4 },   // A: No
    { width: 5 },   // B: Prov
    { width: 16 },  // C: Kab
    // Kering Section (D-U = 18 cols)
    { width: 10 }, { width: 10 },  // D-E: El Nino, IOD+ (wider)
    { width: 6 },   // F: HTH
    { width: 12 },  // G: Musim Kemarau (wider)
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },  // H-K: CH/SH Bulanan & Dasarian (wider)
    { width: 10 },   // L: Ada PDKM (wider)
    { width: 12 }, { width: 12 }, { width: 12 },  // M-O: Prediksi (El Nino, IOD+, Bulan+1)
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },  // P-U: CH/SH Prediksi
    // Ringkasan Kering (V-X = 3 cols)
    { width: 10 }, { width: 8 }, { width: 12 },
    // Basah Section (Y-AP = 18 cols)
    { width: 10 }, { width: 10 },  // Y-Z: La Nina, IOD- (wider)
    { width: 8 },   // AA: HTH Basah
    { width: 12 },  // AB: Musim Hujan (wider)
    { width: 16 }, { width: 14 }, { width: 16 }, { width: 14 },  // AC-AF: CH/SH Bulanan & Dasarian (wider)
    { width: 10 },   // AG: Ada PDCHT (wider)
    { width: 12 }, { width: 12 }, { width: 12 },  // AH-AJ: Prediksi
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },  // AK-AP: CH/SH Prediksi
    // Ringkasan Basah (AQ-AS = 3 cols)
    { width: 10 }, { width: 8 }, { width: 12 },
    // Ringkasan Kombinasi (AT-AU = 2 cols)
    { width: 12 }, { width: 12 },
  ];

  // === ROW 1: Main Title ===
  ws.getRow(1).height = 23;
  ws.mergeCells('A1:AU1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'Identifikasi Anomali Iklim sebagai Salah Satu Faktor Penentu dalam SKPG';
  titleCell.font = { name: 'Calibri', bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // === ROW 2: Score explanation ===
  ws.getRow(2).height = 18;
  ws.mergeCells('A2:AU2');
  const scoreCell = ws.getCell('A2');
  scoreCell.value = 'Jika iya skor = 1 dan jika tidak skor = 0';
  scoreCell.font = { name: 'Calibri', italic: true, size: 10 };
  scoreCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // === ROW 3: Empty ===
  ws.getRow(3).height = 8;

  // === ROW 4: Main Category Headers ===
  ws.getRow(4).height = 25;

  // No, Prov, Kab - merge rows 4-6 (WHITE background)
  ws.mergeCells('A4:A6');
  ws.mergeCells('B4:B6');
  ws.mergeCells('C4:C6');
  applyHeaderStyle(ws.getCell('A4'), COLORS.white);
  applyHeaderStyle(ws.getCell('B4'), COLORS.white);
  applyHeaderStyle(ws.getCell('C4'), COLORS.white);
  ws.getCell('A4').value = 'No';
  ws.getCell('B4').value = 'Prov';
  ws.getCell('C4').value = 'Kab';

  // KERING main header (D4:U4) - YELLOW #FFFF00
  ws.mergeCells('D4:U4');
  const keringMainCell = ws.getCell('D4');
  keringMainCell.value = 'Anomali Iklim yang Berpotensi Mengakibatkan Kondisi Lebih Kering';
  applyHeaderStyle(keringMainCell, COLORS.keringDefault, true, 11);

  // Ringkasan Potensi Kering (V4:X5) - YELLOW
  ws.mergeCells('V4:X5');
  const ringkasanKeringCell = ws.getCell('V4');
  ringkasanKeringCell.value = 'Ringkasan Potensi Kering';
  applyHeaderStyle(ringkasanKeringCell, COLORS.keringDefault);

  // BASAH main header (Y4:AP4) - BLUE #DAEEF3
  ws.mergeCells('Y4:AP4');
  const basahMainCell = ws.getCell('Y4');
  basahMainCell.value = 'Anomali Iklim yang Berpotensi Mengakibatkan Kondisi Lebih Basah';
  applyHeaderStyle(basahMainCell, COLORS.basahDefault, true, 11);

  // Ringkasan Potensi Basah (AQ4:AS5) - BLUE
  ws.mergeCells('AQ4:AS5');
  const ringkasanBasahCell = ws.getCell('AQ4');
  ringkasanBasahCell.value = 'Ringkasan Potensi Basah';
  applyHeaderStyle(ringkasanBasahCell, COLORS.basahDefault);

  // Ringkasan Potensi Anomali Iklim (AT4:AU5) - PINK #FFCCFF
  ws.mergeCells('AT4:AU5');
  const ringkasanKombinasiCell = ws.getCell('AT4');
  ringkasanKombinasiCell.value = 'Ringkasan Potensi Anomali Iklim';
  applyHeaderStyle(ringkasanKombinasiCell, COLORS.ringkasanKombinasi);

  // === ROW 5: Sub-category Headers ===
  ws.getRow(5).height = 20;

  // Kering sub-headers
  ws.mergeCells('D5:E5');
  applyHeaderStyle(ws.getCell('D5'), COLORS.keringDefault);
  ws.getCell('D5').value = 'Anomali Iklim Global';

  ws.mergeCells('F5:L5');
  applyHeaderStyle(ws.getCell('F5'), COLORS.keringDefault);
  ws.getCell('F5').value = 'Monitoring Iklim Regional';

  ws.mergeCells('M5:U5');
  applyHeaderStyle(ws.getCell('M5'), COLORS.keringDefault);
  ws.getCell('M5').value = 'Prediksi Iklim Hingga Tiga Bulan Ke Depan';

  // Basah sub-headers
  ws.mergeCells('Y5:Z5');
  applyHeaderStyle(ws.getCell('Y5'), COLORS.basahDefault);
  ws.getCell('Y5').value = 'Anomali Iklim Global';

  ws.mergeCells('AA5:AG5');
  applyHeaderStyle(ws.getCell('AA5'), COLORS.basahDefault);
  ws.getCell('AA5').value = 'Monitoring Iklim Regional';

  ws.mergeCells('AH5:AP5');
  applyHeaderStyle(ws.getCell('AH5'), COLORS.basahDefault);
  ws.getCell('AH5').value = 'Prediksi Iklim Hingga Tiga Bulan Ke Depan';

  // === ROW 6: Column Headers (height 0.63") ===
  ws.getRow(6).height = 45;

  // Define all column headers and their colors
  // Column index -> [header text, header color, data color]
  // Data colors: ONLY these columns keep color: HTH Kering/Basah, Ada PDKM/PDCHT, El Nino/IOD/La Nina Berlanjut
  const columnConfig: Record<number, { header: string; headerColor: string; dataColor: string }> = {
    // A-C: No, Prov, Kab (white, already merged above)

    // Kering Section
    4: { header: 'El Nino', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
    5: { header: 'IOD Positif', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
    6: { header: 'HTH', headerColor: COLORS.hthKeringPdkm, dataColor: COLORS.hthKeringPdkm }, // Orange entire column
    7: { header: 'Musim Kemarau', headerColor: COLORS.musimKemarau, dataColor: COLORS.white },
    8: { header: 'Curah Hujan Bulanan Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
    9: { header: 'Sifat Hujan Bulanan BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
    10: { header: 'Curah Hujan Dasarian Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
    11: { header: 'Sifat Hujan Dasarian BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
    12: { header: 'Ada PDKM', headerColor: COLORS.hthKeringPdkm, dataColor: COLORS.hthKeringPdkm }, // Orange entire column
    13: { header: 'El Nino Berlanjut', headerColor: COLORS.keringDefault, dataColor: COLORS.keringDefault }, // Yellow data
    14: { header: 'IOD+ Berlanjut', headerColor: COLORS.keringDefault, dataColor: COLORS.keringDefault }, // Yellow data
    15: { header: 'Bulan+1 Kemarau', headerColor: COLORS.musimKemarau, dataColor: COLORS.white },
    16: { header: 'Curah Hujan Bulan+1 Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
    17: { header: 'Sifat Hujan Bulan+1 BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
    18: { header: 'Curah Hujan Bulan+2 Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
    19: { header: 'Sifat Hujan Bulan+2 BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
    20: { header: 'Curah Hujan Bulan+3 Rendah', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
    21: { header: 'Sifat Hujan Bulan+3 BN', headerColor: COLORS.keringDefault, dataColor: COLORS.white },

    // Ringkasan Kering
    22: { header: 'Total Skor', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
    23: { header: 'Kelas', headerColor: COLORS.keringDefault, dataColor: COLORS.white },
    24: { header: 'Kategori', headerColor: COLORS.keringDefault, dataColor: COLORS.white },

    // Basah Section
    25: { header: 'La Nina', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
    26: { header: 'IOD Negatif', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
    27: { header: 'HTH Basah', headerColor: COLORS.hthBasahPdcht, dataColor: COLORS.hthBasahPdcht }, // Dark green entire column
    28: { header: 'Musim Hujan', headerColor: COLORS.musimHujan, dataColor: COLORS.white },
    29: { header: 'Curah Hujan Bulanan Tinggi/ Sangat Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
    30: { header: 'Sifat Hujan Bulanan AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
    31: { header: 'Curah Hujan Dasarian Tinggi/ Sangat Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
    32: { header: 'Sifat Hujan Dasarian AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
    33: { header: 'Ada PDCHT', headerColor: COLORS.hthBasahPdcht, dataColor: COLORS.hthBasahPdcht }, // Dark green entire column
    34: { header: 'La Nina Berlanjut', headerColor: COLORS.basahDefault, dataColor: COLORS.basahDefault }, // Blue data
    35: { header: 'IOD- Berlanjut', headerColor: COLORS.basahDefault, dataColor: COLORS.basahDefault }, // Blue data
    36: { header: 'Bulan+1 Hujan', headerColor: COLORS.musimHujan, dataColor: COLORS.white },
    37: { header: 'Curah Hujan Bulan+1 Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
    38: { header: 'Sifat Hujan Bulan+1 AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
    39: { header: 'Curah Hujan Bulan+2 Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
    40: { header: 'Sifat Hujan Bulan+2 AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
    41: { header: 'Curah Hujan Bulan+3 Tinggi', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
    42: { header: 'Sifat Hujan Bulan+3 AN', headerColor: COLORS.basahDefault, dataColor: COLORS.white },

    // Ringkasan Basah
    43: { header: 'Total Skor', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
    44: { header: 'Kelas', headerColor: COLORS.basahDefault, dataColor: COLORS.white },
    45: { header: 'Kategori', headerColor: COLORS.basahDefault, dataColor: COLORS.white },

    // Ringkasan Kombinasi (PINK #FFCCFF for header & Kombinasi Kelas column)
    46: { header: 'Kombinasi Kelas', headerColor: COLORS.ringkasanKombinasi, dataColor: COLORS.ringkasanKombinasi },
    47: { header: 'Kategori', headerColor: COLORS.ringkasanKombinasi, dataColor: COLORS.white },
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
      row.kabupaten,     // 3: Kab
      // Kering data
      row.kering.elNino, // 4
      row.kering.iodPositif, // 5
      row.kering.hthKering, // 6
      row.kering.musimKemarau, // 7
      row.kering.chBulananRendah, // 8
      row.kering.shBulananBN, // 9
      row.kering.chDasarianRendah, // 10
      row.kering.shDasarianBN, // 11
      row.kering.pdkm, // 12
      row.kering.elNinoBerlanjut, // 13
      row.kering.iodPositifBerlanjut, // 14
      row.kering.bulanPlus1Kemarau, // 15
      row.kering.chPlus1Rendah, // 16
      row.kering.shPlus1BN, // 17
      row.kering.chPlus2Rendah, // 18
      row.kering.shPlus2BN, // 19
      row.kering.chPlus3Rendah, // 20
      row.kering.shPlus3BN, // 21
      // Ringkasan Kering
      row.keringTotal, // 22
      row.keringKelas, // 23
      row.keringKategori, // 24
      // Basah data
      row.basah.laNina, // 25
      row.basah.iodNegatif, // 26
      row.basah.hthBasah, // 27
      row.basah.musimHujan, // 28
      row.basah.chBulananTinggi, // 29
      row.basah.shBulananAN, // 30
      row.basah.chDasarianTinggi, // 31
      row.basah.shDasarianAN, // 32
      row.basah.pdcht, // 33
      row.basah.laNinaBerlanjut, // 34
      row.basah.iodNegatifBerlanjut, // 35
      row.basah.bulanPlus1Hujan, // 36
      row.basah.chPlus1Tinggi, // 37
      row.basah.shPlus1AN, // 38
      row.basah.chPlus2Tinggi, // 39
      row.basah.shPlus2AN, // 40
      row.basah.chPlus3Tinggi, // 41
      row.basah.shPlus3AN, // 42
      // Ringkasan Basah
      row.basahTotal, // 43
      row.basahKelas, // 44
      row.basahKategori, // 45
      // Ringkasan Kombinasi
      row.combinedKelas, // 46
      row.combinedKategori, // 47
    ];

    values.forEach((value, colIdx) => {
      const col = colIdx + 1;
      const cell = ws.getCell(rowNum, col);
      cell.value = value;

      // Get data color from config or default
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
    { width: 8 },   // D: Skor Kering
    { width: 8 },   // E: Kelas Kering
    { width: 12 },  // F: Kategori Kering
    { width: 8 },   // G: Skor Basah
    { width: 8 },   // H: Kelas Basah
    { width: 12 },  // I: Kategori Basah
    { width: 14 }, // J: Kombinasi Kelas
    { width: 12 },  // K: Kategori
  ];

  // Get current month and year for title
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const currentMonth = months[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  // Row 1: Main Title
  wsRingkasan.getRow(1).height = 20;
  wsRingkasan.mergeCells('A1:K1');
  const ringkasanTitle = wsRingkasan.getCell('A1');
  ringkasanTitle.value = 'Ringkasan Identifikasi Anomali Iklim sebagai Salah Satu Faktor Rekomendasi dalam SKPG';
  ringkasanTitle.font = { name: 'Calibri', bold: true, size: 12 };
  ringkasanTitle.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 2: Update date
  wsRingkasan.mergeCells('A2:K2');
  const updateDate = wsRingkasan.getCell('A2');
  updateDate.value = `Update ${currentMonth} ${currentYear}`;
  updateDate.font = { name: 'Calibri', bold: true, size: 11 };
  updateDate.alignment = { horizontal: 'center', vertical: 'middle' };

  // Row 3: Empty
  wsRingkasan.getRow(3).height = 8;

  // Row 4: Main category headers
  wsRingkasan.getRow(4).height = 20;

  // No, Provinsi, Kabupaten - merge rows 4-5
  wsRingkasan.mergeCells('A4:A5');
  wsRingkasan.mergeCells('B4:B5');
  wsRingkasan.mergeCells('C4:C5');
  applyHeaderStyle(wsRingkasan.getCell('A4'), COLORS.white);
  applyHeaderStyle(wsRingkasan.getCell('B4'), COLORS.white);
  applyHeaderStyle(wsRingkasan.getCell('C4'), COLORS.white);
  wsRingkasan.getCell('A4').value = 'No';
  wsRingkasan.getCell('B4').value = 'Provinsi';
  wsRingkasan.getCell('C4').value = 'Kabupaten';

  // Ringkasan Potensi Kering (D4:F4)
  wsRingkasan.mergeCells('D4:F4');
  const ringkasanKeringHeader = wsRingkasan.getCell('D4');
  ringkasanKeringHeader.value = 'Ringkasan Potensi Kering';
  applyHeaderStyle(ringkasanKeringHeader, COLORS.keringDefault);

  // Ringkasan Potensi Basah (G4:I4)
  wsRingkasan.mergeCells('G4:I4');
  const ringkasanBasahHeader = wsRingkasan.getCell('G4');
  ringkasanBasahHeader.value = 'Ringkasan Potensi Basah';
  applyHeaderStyle(ringkasanBasahHeader, COLORS.basahDefault);

  // Ringkasan Kondisi Iklim (J4:K4)
  wsRingkasan.mergeCells('J4:K4');
  const ringkasanKondisiHeader = wsRingkasan.getCell('J4');
  ringkasanKondisiHeader.value = 'Ringkasan Kondisi Iklim';
  applyHeaderStyle(ringkasanKondisiHeader, COLORS.ringkasanKombinasi);

  // Row 5: Sub-headers
  wsRingkasan.getRow(5).height = 20;

  // Kering sub-headers
  applyHeaderStyle(wsRingkasan.getCell('D5'), COLORS.keringDefault);
  wsRingkasan.getCell('D5').value = 'Skor';
  applyHeaderStyle(wsRingkasan.getCell('E5'), COLORS.keringDefault);
  wsRingkasan.getCell('E5').value = 'Kelas';
  applyHeaderStyle(wsRingkasan.getCell('F5'), COLORS.keringDefault);
  wsRingkasan.getCell('F5').value = 'Kategori';

  // Basah sub-headers
  applyHeaderStyle(wsRingkasan.getCell('G5'), COLORS.basahDefault);
  wsRingkasan.getCell('G5').value = 'Skor';
  applyHeaderStyle(wsRingkasan.getCell('H5'), COLORS.basahDefault);
  wsRingkasan.getCell('H5').value = 'Kelas';
  applyHeaderStyle(wsRingkasan.getCell('I5'), COLORS.basahDefault);
  wsRingkasan.getCell('I5').value = 'Kategori';

  // Kondisi Iklim sub-headers
  applyHeaderStyle(wsRingkasan.getCell('J5'), COLORS.ringkasanKombinasi);
  wsRingkasan.getCell('J5').value = 'Kombinasi Kelas';
  applyHeaderStyle(wsRingkasan.getCell('K5'), COLORS.ringkasanKombinasi);
  wsRingkasan.getCell('K5').value = 'Kategori';

  // Data rows (starting from row 6)
  allData.forEach((row, idx) => {
    const rowNum = idx + 6;
    const excelRow = wsRingkasan.getRow(rowNum);
    excelRow.height = 18;

    const values = [
      idx + 1,           // A: No
      'DIY',             // B: Provinsi
      row.kabupaten,     // C: Kabupaten
      row.keringTotal,   // D: Skor Kering
      row.keringKelas,   // E: Kelas Kering
      row.keringKategori, // F: Kategori Kering
      row.basahTotal,    // G: Skor Basah
      row.basahKelas,    // H: Kelas Basah
      row.basahKategori, // I: Kategori Basah
      row.combinedKelas, // J: Kombinasi Kelas
      row.combinedKategori, // K: Kategori
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

  // Generate filename
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const filename = `SKPG_DIY_${timestamp}.xlsx`;

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
};
