export default function handler(req, res) {
  const key = process.env.NTAG_KEY || '';
  res.status(200).json({ keyLength: key.length, firstSix: key.substring(0,6), lastSix: key.slice(-6) });
}