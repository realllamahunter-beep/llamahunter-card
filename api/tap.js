import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { decryptPicc, calculateCmacBuffer } = require('node-sdm');

const keyHex = (process.env.NTAG_KEY || '').trim();

export default async function handler(req, res) {
  try {
    // Grab the LAST picc_data and cmac (handles trial watermark duplicates)
    const rawParams = new URLSearchParams(req.url.split('?')[1] || '');
    const allPiccData = rawParams.getAll('picc_data');
    const allCmac = rawParams.getAll('cmac');
    const picc_data = allPiccData[allPiccData.length - 1];
    const cmac = allCmac[allCmac.length - 1];

    if (!picc_data || !cmac) {
      return res.redirect('/?valid=false');
    }

    const piccBuffer = Buffer.from(picc_data, 'hex');
    const cmacBuffer = Buffer.from(cmac, 'hex');
    const keyBuffer = Buffer.from(keyHex, 'hex');

    // Decrypt the PICC data → returns { uid: hexString, cnt: Buffer, cntInt: number }
    const decrypted = decryptPicc(piccBuffer, keyBuffer);

    // Build the plain PICC data: 7‑byte UID + 3‑byte counter (as Buffer)
    const uidBuffer = Buffer.from(decrypted.uid, 'hex');
    const counterBuffer = decrypted.cnt;   // this is the raw 3‑byte buffer
    const plainData = Buffer.concat([uidBuffer, counterBuffer]);

    // Re‑compute the CMAC over the plain data
    const expectedCmac = calculateCmacBuffer(plainData, keyBuffer);

    if (expectedCmac.equals(cmacBuffer)) {
      // Convert the counter to an unsigned integer for display
      const counter = counterBuffer.readUIntLE(0, 3);
      return res.redirect(`/?uid=${decrypted.uid}&counter=${counter}&valid=true`);
    } else {
      return res.redirect('/?valid=false');
    }
  } catch (error) {
    return res.status(200).json({ error: error.message });
  }
}