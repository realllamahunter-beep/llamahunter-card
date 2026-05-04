import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sdm = require('node-sdm');

export default function handler(req, res) {
  res.status(200).json({
    type: typeof sdm,
    keys: Object.keys(sdm),
    hasDefault: typeof sdm.default,
    sampleDefault: typeof sdm.default,
  });
}