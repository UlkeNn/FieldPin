// src/features/workorders/utils/plate.ts
//
// Türk plakası için normalleştirme + doğrulama yardımcıları.
// OCR (plaka tanıma) çıktısı çoğu zaman gürültülüdür: boşluk yok, harf/rakam
// karışıklığı (O↔0, I↔1, B↔8, S↔5 ...), küçük/büyük harf, Türkçe karakter vb.
// Bu modül saf fonksiyonlardan oluşur; hiçbir dış bağımlılığı yoktur.

/** Geçerli il kodları 01–81 arasıdır. */
const MIN_PROVINCE = 1;
const MAX_PROVINCE = 81;

// Sayı bloğunda harf görülürse rakama, harf bloğunda rakam görülürse harfe çevirmek için
// kullanılan yaygın OCR karışıklık haritaları.
const LETTER_TO_DIGIT: Record<string, string> = {
  O: "0",
  Q: "0",
  D: "0",
  I: "1",
  L: "1",
  Z: "2",
  E: "3",
  A: "4",
  S: "5",
  G: "6",
  T: "7",
  B: "8",
  P: "9",
};

const DIGIT_TO_LETTER: Record<string, string> = {
  "0": "O",
  "1": "I",
  "2": "Z",
  "5": "S",
  "6": "G",
  "8": "B",
};

/** Türkçe karakterleri Latin karşılıklarına indirger, büyük harfe çevirir. */
function toLatinUpper(input: string): string {
  return input
    .replace(/İ/g, "I")
    .replace(/ı/g, "I")
    .replace(/Ş/g, "S")
    .replace(/ş/g, "S")
    .replace(/Ğ/g, "G")
    .replace(/ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/ü/g, "U")
    .replace(/Ö/g, "O")
    .replace(/ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/ç/g, "C")
    .toUpperCase();
}

/** Sadece A–Z ve 0–9 bırakır. */
function stripToAlnum(input: string): string {
  return toLatinUpper(input).replace(/[^A-Z0-9]/g, "");
}

export type ParsedPlate = {
  province: string; // "34"
  letters: string; // "ABC"
  digits: string; // "123"
};

/**
 * Ham bir dizgeyi PP-HARF-RAKAM bloklarına ayırmaya çalışır.
 * Belirsizlikleri OCR karışıklık haritalarıyla çözer. Başarısız olursa null döner.
 */
function parse(raw: string): ParsedPlate | null {
  const s = stripToAlnum(raw);
  if (s.length < 5 || s.length > 8) return null;

  // İl kodu: ilk iki karakter rakam olmalı (harfe takılırsa rakama zorla).
  const p0 = s[0] in LETTER_TO_DIGIT && !/\d/.test(s[0]) ? LETTER_TO_DIGIT[s[0]] : s[0];
  const p1 = s[1] in LETTER_TO_DIGIT && !/\d/.test(s[1]) ? LETTER_TO_DIGIT[s[1]] : s[1];
  if (!/\d/.test(p0) || !/\d/.test(p1)) return null;
  const province = `${p0}${p1}`;

  const rest = s.slice(2);

  // Kalanı harf bloğu + rakam bloğu olarak ayır: baştaki harfler, sondaki rakamlar.
  // Aradaki belirsiz karakteri konumuna göre düzeltiriz.
  let i = 0;
  let letters = "";
  while (i < rest.length && /[A-Z]/.test(rest[i]) && letters.length < 3) {
    letters += rest[i];
    i++;
  }

  let digits = rest.slice(i);

  // Harf bloğu boşsa (örn. OCR ilk harfi rakam okuduysa) düzeltmeyi dene.
  if (!letters && digits.length) {
    const fixed = digits[0] in DIGIT_TO_LETTER ? DIGIT_TO_LETTER[digits[0]] : "";
    if (fixed) {
      letters = fixed;
      digits = digits.slice(1);
    }
  }

  // Rakam bloğunda harf kaldıysa rakama çevir.
  digits = digits
    .split("")
    .map((c) => (/[A-Z]/.test(c) ? (LETTER_TO_DIGIT[c] ?? c) : c))
    .join("");

  if (!letters || letters.length > 3) return null;
  if (!/^\d{2,5}$/.test(digits)) return null;

  return { province, letters, digits };
}

/** Bilinen Türk plaka harf/rakam kombinasyonlarını doğrular. */
function isValidCombo(p: ParsedPlate): boolean {
  const prov = Number.parseInt(p.province, 10);
  if (Number.isNaN(prov) || prov < MIN_PROVINCE || prov > MAX_PROVINCE) return false;

  const L = p.letters.length;
  const D = p.digits.length;

  // Resmî kalıplar:
  //  1 harf → 4 ya da 5 rakam
  //  2 harf → 3 ya da 4 rakam
  //  3 harf → 2 ya da 3 rakam
  if (L === 1) return D === 4 || D === 5;
  if (L === 2) return D === 3 || D === 4;
  if (L === 3) return D === 2 || D === 3;
  return false;
}

/** Ayrıştırılmış plakayı "34 ABC 123" biçiminde döndürür. */
export function formatPlate(p: ParsedPlate): string {
  return `${p.province} ${p.letters} ${p.digits}`;
}

export type PlateNormalizeResult = {
  /** "34 ABC 123" biçiminde, ayrıştırılabildiyse; aksi halde temizlenmiş ham metin. */
  value: string;
  /** Bilinen bir Türk plaka kalıbına uydu mu. */
  isValid: boolean;
  parsed: ParsedPlate | null;
};

/**
 * Ham OCR / kullanıcı girdisini normalleştirir.
 * Ayrıştırılamazsa value alanına büyük-harf, boşlukları sadeleştirilmiş hali konur
 * ki kullanıcı modaldaki onay alanında elle düzeltebilsin.
 */
export function normalizePlate(raw: string): PlateNormalizeResult {
  const parsed = parse(raw ?? "");
  if (parsed) {
    return { value: formatPlate(parsed), isValid: isValidCombo(parsed), parsed };
  }
  const fallback = toLatinUpper(raw ?? "").replace(/\s+/g, " ").trim();
  return { value: fallback, isValid: false, parsed: null };
}

/** Hızlı geçerlilik kontrolü (kayıttan önce vb. için). */
export function isValidPlate(raw: string): boolean {
  return normalizePlate(raw).isValid;
}
