// Notion API 프록시 서버
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { apiKey, databaseId } = req.body;

  if (!apiKey || !databaseId) {
    res.status(400).json({ error: 'apiKey와 databaseId가 필요합니다' });
    return;
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 100
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      res.status(response.status).json({
        error: errorData.message || 'Notion API 오류',
        details: errorData
      });
      return;
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      error: '서버 오류',
      message: error.message
    });
  }
}
