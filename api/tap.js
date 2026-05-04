export default function handler(req, res) {
  const query = req.url.split('?')[1] || '';
  const params = Object.fromEntries(
    new URLSearchParams(query).entries()
  );
  res.status(200).json({
    fullQuery: query,
    paramNames: Object.keys(params),
    piccDataLength: (params.picc_data || '').length,
    cmacLength: (params.cmac || '').length,
    piccDataValue: (params.picc_data || '').substring(0, 20) + '...',
    cmacValue: (params.cmac || '').substring(0, 10) + '...',
  });
}