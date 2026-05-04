import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { decryptPicc, calculateCmacBuffer } = require('node-sdm');

const keyHex = (process.env.NTAG_KEY || '').trim();

export default async function handler(req, res) {
  try {
    // Grab the last picc_data and cmac (skip trial watermark duplicates)
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

    // decrypt the PICC data → returns a Buffer (7‑byte UID + 3‑byte counter)
    const decrypted = decryptPicc(piccBuffer, keyBuffer);
    const uidBuffer = decrypted.slice(0, 7);
    const counterBuffer = decrypted.slice(7, 10);
    const plainData = Buffer.concat([uidBuffer, counterBuffer]);

    // compute the CMAC over the plain UID+counter
    const expectedCmac = calculateCmacBuffer(plainData, keyBuffer);

    if (expectedCmac.equals(cmacBuffer)) {
      // convert UID to hex string for display, counter as unsigned integer
      const uid = uidBuffer.toString('hex');
      const counter = counterBuffer.readUIntLE(0, 3);
      return res.redirect(`/?uid=${uid}&counter=${counter}&valid=true`);
    } else {
      return res.redirect('/?valid=false');
    }
  } catch (error) {
    // temporary debug – we'll remove after success
    return res.status(200).json({ error: error.message });
  }
}