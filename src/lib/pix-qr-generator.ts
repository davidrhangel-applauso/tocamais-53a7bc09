import QRCode from 'qrcode';

// PIX EMV QR Code generator
// Based on BR Code specification (Banco Central do Brasil)

function computeCRC16(payload: string): string {
  const polynomial = 0x1021;
  let crc = 0xFFFF;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
  }

  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

function formatPixKey(keyType: string, key: string): string {
  // Clean the key based on type
  let cleanKey = key.trim();
  
  switch (keyType) {
    case 'cpf':
      cleanKey = cleanKey.replace(/\D/g, '');
      break;
    case 'celular':
      cleanKey = cleanKey.replace(/\D/g, '');
      if (!cleanKey.startsWith('55')) {
        cleanKey = '55' + cleanKey;
      }
      cleanKey = '+' + cleanKey;
      break;
    case 'email':
      cleanKey = cleanKey.toLowerCase();
      break;
    case 'aleatoria':
      // Keep as-is
      break;
  }
  
  return cleanKey;
}

interface PixQRCodeOptions {
  pixKey: string;
  keyType: string;
  merchantName: string;
  merchantCity: string;
  amount?: number;
  transactionId?: string;
}

export function generatePixPayload(options: PixQRCodeOptions): string {
  const {
    pixKey,
    keyType,
    merchantName,
    merchantCity,
    amount,
    transactionId = '***'
  } = options;

  const formattedKey = formatPixKey(keyType, pixKey);
  
  // Merchant Account Information (ID 26)
  // GUI (ID 00) = br.gov.bcb.pix
  // Key (ID 01) = PIX key
  const gui = formatField('00', 'br.gov.bcb.pix');
  const keyField = formatField('01', formattedKey);
  const merchantAccountInfo = formatField('26', gui + keyField);

  // Build payload
  let payload = '';
  
  // Payload Format Indicator
  payload += formatField('00', '01');
  
  // Point of Initiation Method (11 = static, 12 = dynamic)
  payload += formatField('01', amount ? '12' : '11');
  
  // Merchant Account Information
  payload += merchantAccountInfo;
  
  // Merchant Category Code
  payload += formatField('52', '0000');
  
  // Transaction Currency (986 = BRL)
  payload += formatField('53', '986');
  
  // Transaction Amount (optional)
  if (amount && amount > 0) {
    payload += formatField('54', amount.toFixed(2));
  }
  
  // Country Code
  payload += formatField('58', 'BR');
  
  // Merchant Name (max 25 chars)
  const cleanName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 25)
    .toUpperCase();
  payload += formatField('59', cleanName);
  
  // Merchant City (max 15 chars)
  const cleanCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 15)
    .toUpperCase();
  payload += formatField('60', cleanCity);
  
  // Additional Data Field Template (ID 62) with Transaction ID (ID 05)
  const txId = formatField('05', transactionId);
  payload += formatField('62', txId);
  
  // CRC16 placeholder
  payload += '6304';
  
  // Calculate and append CRC16
  const crc = computeCRC16(payload);
  payload = payload.slice(0, -4) + formatField('63', crc);
  
  return payload;
}

export async function generatePixQRCodeDataUrl(options: PixQRCodeOptions): Promise<string> {
  const payload = generatePixPayload(options);
  
  const qrDataUrl = await QRCode.toDataURL(payload, {
    type: 'image/png',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  });
  
  return qrDataUrl;
}

export async function generatePixQRCodeBlob(options: PixQRCodeOptions): Promise<Blob> {
  const dataUrl = await generatePixQRCodeDataUrl(options);
  const response = await fetch(dataUrl);
  return response.blob();
}
