import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { calculateCmacData, decryptPicc } = require('node-sdm');

const keyHex = (process.env.NTAG_KEY || '').trim();

export default async function handler(req, res) {
  // Grab the LAST picc_data and cmac (skip watermark junk)
  const rawParams = new URLSearchParams(req.url.split('?')[1] || '');
  const allPiccData = rawParams.getAll('picc_data');
  const allCmac = rawParams.getAll('cmac');
  const picc_data = allPiccData[allPiccData.length - 1];
  const cmac = allCmac[allCmac.length - 1];

  if (!picc_data || !cmac) {
    return res.status(200).json({ error: 'missing parameters' });
  }

  try {
    const piccBuffer = Buffer.from(picc_data, 'hex');
    const cmacBuffer = Buffer.from(cmac, 'hex');
    const keyBuffer = Buffer.from(keyHex, 'hex');

    // Decrypt the PICC data
    const decrypted = decryptPicc(piccBuffer, keyBuffer);

    let uid, counter;
    if (Buffer.isBuffer(decrypted)) {
      // The library returned a Buffer: first 7 bytes = UID, next 3 = counter
      const uidBytes = decrypted.slice(0, 7);
      const counterBytes = decrypted.slice(7, 10);
      uid = uidBytes.toString('hex');
      counter = counterBytes.readUIntLE(0, 3);
    } else if (decrypted && typeof decrypted === 'object') {
      // Alternative: library might have returned an object with uid / cntInt
      uid = decrypted.uid;
      counter = decrypted.cntInt;
    } else {
      return res.status(200).json({ error: 'unexpected decrypt output', type: typeof decrypted });
    }

    // Calculate the expected CMAC using the library's helper
    const expectedCmac = calculateCmacData(uid, counter, keyBuffer);
    const valid = expectedCmac.equals(cmacBuffer);

    // Return all the clues
    return res.status(200).json({
      uid: uid,
      counter: counter,
      receivedCmac: cmac,
      expectedCmac: expectedCmac.toString('hex'),
      valid: valid,
      keyFirst6: keyHex.substring(0, 6),
      keyLast6: keyHex.slice(-6),
    });
  } catch (e) {
    return res.status(200).json({ error: e.message, stack: e.stack });
  }
}