import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { decryptPicc, calculateCmacData } = require('node-sdm');

const keyHex = (process.env.NTAG_KEY || '').trim();

export default async function handler(req, res) {
  try {
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

    // decrypt the PICC data
    const decrypted = decryptPicc(piccBuffer, keyBuffer);
    const uid = decrypted.uid;
    const counter = decrypted.cntInt;

    // recompute the CMAC
    const expectedCmac = calculateCmacData(uid, counter, keyBuffer);

    if (expectedCmac.equals(cmacBuffer)) {
      return res.redirect(`/?uid=${uid}&counter=${counter}&valid=true`);
    } else {
      return res.redirect('/?valid=false');
    }
  } catch (error) {
    // temporary debug — we'll remove after success
    return res.status(200).json({ error: error.message });
  }
}