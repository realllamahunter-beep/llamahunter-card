import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const verifySDM = require('node-sdm');

const key = (process.env.NTAG_KEY || '').trim(); // remove invisible chars

export default async function handler(req, res) {
  // Because of trial watermark, there are duplicate parameters.
  // We need the LAST instance (the real dynamic data).
  const rawParams = new URLSearchParams(req.url.split('?')[1] || '');
  const allPiccData = rawParams.getAll('picc_data');
  const allCmac = rawParams.getAll('cmac');

  const picc_data = allPiccData[allPiccData.length - 1];
  const cmac = allCmac[allCmac.length - 1];

  if (!picc_data || !cmac) {
    return res.redirect('/?valid=false');
  }

  try {
    // Call the library function (plain function, not a constructor)
    const result = verifySDM(picc_data, cmac, key, { encoding: 'hex' });

    if (result.valid) {
      return res.redirect(`/?uid=${result.uid}&counter=${result.counter}&valid=true`);
    }
  } catch (e) {
    console.error(e);
  }

  return res.redirect('/?valid=false');
}