exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  try {
    const { testo } = JSON.parse(event.body);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: 'Sei un assistente di TrovaImpresa. Un cliente ha scritto: "' + testo + '". Rispondi SOLO con JSON: {"categoria": "artigiano|impresa|grande_impresa|negozio|professionista", "motivo": "spiegazione breve", "pagina": "cerca-artigiani.html|cerca-imprese.html|cerca-grandi-imprese.html|cerca-negozi.html|cerca-professionisti.html"}' }]
      })
    });
    const data = await response.json();
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: data.content[0].text.trim() };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
