function tlv(id: string, value: string) {
  const normalized = value.slice(0, 99);
  return `${id}${normalized.length.toString().padStart(2, "0")}${normalized}`;
}

function crc16Ccitt(payload: string) {
  let crc = 0xffff;
  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function normalizeContent(value: string, maxLength: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^A-Za-z0-9\s-]/g, "")
    .trim()
    .slice(0, maxLength);
}

export interface VietQrAccount {
  bankBin?: string;
  accountNo?: string;
  accountName?: string;
}

export function buildVietQrPayload(amount: number, description: string, account?: VietQrAccount) {
  const bankBin = account?.bankBin ?? process.env.BANK_BIN ?? "";
  const accountNo = account?.accountNo ?? process.env.BANK_ACCOUNT_NO ?? "";
  const accountName = normalizeContent(account?.accountName ?? process.env.BANK_ACCOUNT_NAME ?? "SPLITMATES", 25);
  const content = normalizeContent(description, 80);

  if (!bankBin || !accountNo) {
    return `STK: ${accountNo || "CHUA_CAU_HINH"}\nNH: ${bankBin || "CHUA_CAU_HINH"}\nTEN: ${accountName}\nSO TIEN: ${amount}\nNOI DUNG: ${content}`;
  }

  const consumerAccount = tlv("00", "A000000727") + tlv("01", tlv("00", bankBin) + tlv("01", accountNo)) + tlv("02", "QRIBFTTA");
  const additionalData = tlv("08", content || "CHIA TIEN");
  const payloadWithoutCrc =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("38", consumerAccount) +
    tlv("53", "704") +
    tlv("54", String(Math.round(amount))) +
    tlv("58", "VN") +
    tlv("59", accountName) +
    tlv("60", "HANOI") +
    tlv("62", additionalData) +
    "6304";

  return `${payloadWithoutCrc}${crc16Ccitt(payloadWithoutCrc)}`;
}
