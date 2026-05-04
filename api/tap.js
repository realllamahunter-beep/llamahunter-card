import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { calculateCmacBuffer, decryptPicc } = require('node-sdm');

const keyHex = (process.env.NTAG_KEY || '').trim();

export default async function handler(req, res) {
  // Because of the trial watermark, there may be duplicate parameters.
  // We always take the last occurrence (the real dynamic data).
  const rawParams = new URLSearchParams(req.url.split('?')[1] || '');
  const allPiccData = rawParams.getAll('picc_data');
  const allCmac = rawParams.getAll('cmac');
  const picc_data = allPiccData[allPiccData.length - 1];
  const cmac = allCmac[allCmac.length - 1];

  if (!picc_data || !cmac) {
    return res.redirect('/?valid=false');
  }

  try {
    const piccBuffer = Buffer.from(picc_data, 'hex');
    const cmacBuffer = Buffer.from(cmac, 'hex');
    const keyBuffer = Buffer.from(keyHex, 'hex');

    // 1. Compute expected CMAC over PICC data
    const expectedCmac = calculateCmacBuffer(piccBuffer, keyBuffer);

    // 2. Compare CMACs
    if (!expectedCmac.equals(cmacBuffer)) {
      return res.redirect('/?valid=false');
    }

    // 3. Decrypt PICC data to extract UID and counter
    const decrypted = decryptPicc(piccBuffer, keyBuffer);
    const uidBytes = decrypted.slice(0, 7);
    const counterBytes = decrypted.slice(7, 10);
    const uid = uidBytes.toString('hex');
    const counter = counterBytes.readUIntLE(0, 3);

    return res.redirect(`/?uid=${uid}&counter=${counter}&valid=true`);
  } catch (e) {
    console.error(e);
    return res.redirect('/?valid=false');
  }
}