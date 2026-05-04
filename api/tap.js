import verifySDM from 'node-sdm';

const key = process.env.NTAG_KEY;

export default async function handler(req, res) {
  const { picc_data, cmac } = req.query;

  // Return a debug page with all info
  const debug = {
    timestamp: new Date().toISOString(),
    hasPiccData: !!picc_data,
    piccDataLength: picc_data ? picc_data.length : 0,
    hasCmac: !!cmac,
    cmacLength: cmac ? cmac.length : 0,
    keyLength: key ? key.length : 0,
    keyFirstChars: key ? key.substring(0, 6) + '...' : 'undefined',
    rawQuery: req.url,
  };

  try {
    const result = verifySDM(picc_data, cmac, key, { encoding: 'hex' });
    debug.result = result;
  } catch (e) {
    debug.error = e.message;
    debug.errorStack = e.stack;
  }

  res.status(200).json(debug);
}