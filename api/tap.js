import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { calculateCmacData, decryptPicc } = require('node-sdm');

const keyHex = (process.env.NTAG_KEY || '').trim();

export default async function handler(req, res) {
  // Handle duplicate params (trial watermark)
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

    // Decrypt first, then verify CMAC over plain data
    const decrypted = decryptPicc(piccBuffer, keyBuffer);
    const uid = decrypted.uid;
    const counter = decrypted.cntInt;

    const expectedCmac = calculateCmacData(uid, counter, keyBuffer);

    if (expectedCmac.equals(cmacBuffer)) {
      return res.redirect(`/?uid=${uid}&counter=${counter}&valid=true`);
    } else {
      return res.redirect('/?valid=false');
    }
  } catch (e) {
    console.error(e);
    return res.redirect('/?valid=false');
  }
}