import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { calculateCmacData, decryptPicc } = require('node-sdm');

const keyHex = (process.env.NTAG_KEY || '').trim();

export default async function handler(req, res) {
  // Handle duplicate params from any trial watermark
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

    // ✅ Step 1: Decrypt the PICC data to get the real UID & counter
    const decrypted = decryptPicc(piccBuffer, keyBuffer);
    const uid = decrypted.uid;
    const counter = decrypted.cntInt;

    // ✅ Step 2: Re-compute the CMAC over the plain PICC data
    const expectedCmac = calculateCmacData(uid, counter, keyBuffer);

    // ✅ Step 3: Compare the expected CMAC with what the chip sent
    if (!expectedCmac.equals(cmacBuffer)) {
      return res.redirect('/?valid=false');
    }

    return res.redirect(`/?uid=${uid}&counter=${counter}&valid=true`);
  } catch (e) {
    console.error(e);
    return res.redirect('/?valid=false');
  }
}