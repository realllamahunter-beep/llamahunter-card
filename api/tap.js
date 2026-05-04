import { SDM } from 'node-sdm';

const key = process.env.NTAG_KEY;

export default async function handler(req, res) {
  const { picc_data, cmac } = req.query;

  if (!picc_data || !cmac) {
    return res.redirect('/?valid=false');
  }

  try {
    const sdm = new SDM(key);
    const result = sdm.verify(picc_data, cmac);

    if (result.valid) {
      return res.redirect(`/?uid=${result.uid}&counter=${result.counter}&valid=true`);
    }
  } catch (e) {
    console.error(e);
  }

  return res.redirect('/?valid=false');
}