export default function handler(req, res) {
  const rawKey = process.env.NTAG_KEY || '';
  const keyHex = rawKey.trim();
  const keyBuffer = Buffer.from(keyHex, 'hex');
  res.status(200).json({
    rawLength: rawKey.length,
    trimmedLength: keyHex.length,
    bufferByteLength: keyBuffer.length,
    firstByte: keyBuffer[0],
    lastByte: keyBuffer[keyBuffer.length - 1],
    firstSixHex: keyHex.substring(0, 6),
    lastSixHex: keyHex.slice(-6),
  });
}