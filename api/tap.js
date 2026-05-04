import verifySDM from 'node-sdm';

const key = process.env.NTAG_KEY;

export default async function handler(req, res) {
  const { picc_data, cmac } = req.query;

  if (!picc_data || !cmac) {
    return res.redirect('/?valid=false');
  }

  try {
    // The library expects (piccData, cmac, key, options)
    const result = verifySDM(picc_data, cmac, key, { encoding: 'hex' });

    if (result.valid) {
      return res.redirect(`/?uid=${result.uid}&counter=${result.counter}&valid=true`);
    }
  } catch (err) {
    console.error('Verification error:', err);
  }

  return res.redirect('/?valid=false');
}