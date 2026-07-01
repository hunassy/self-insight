// ============================
// Self Insight 用 APIサーバー
// ============================
// 役割：ブラウザからのリクエストを受け取り
//       Anthropic APIに中継して結果を返す
// 起動方法：node server.js
// ============================

var http = require('http');
var https = require('https');

// ============================
// APIキーをここに貼る
// ============================
var ANTHROPIC_API_KEY = 'ここにAnthropicのAPIキーを貼る';

// サーバーのポート番号
var PORT = 3000;

var server = http.createServer(function(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/summary') {

    var body = '';
    req.on('data', function(chunk) {
      body += chunk.toString();
    });

    req.on('end', function() {

      var parsed;
      try {
        parsed = JSON.parse(body);
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'JSONの形式が正しくありません' }));
        return;
      }

      var requestBody = JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [
          { role: 'user', content: parsed.prompt }
        ]
      });

      var options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      };

      var apiReq = https.request(options, function(apiRes) {

        var apiBody = '';
        apiRes.on('data', function(chunk) {
          apiBody += chunk.toString();
        });

        apiRes.on('end', function() {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(apiBody);
        });
      });

      apiReq.on('error', function(e) {
        console.log('Anthropic APIエラー:', e.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: e.message }));
      });

      apiReq.write(requestBody);
      apiReq.end();
    });

  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, function() {
  console.log('サーバーが起動しました: http://localhost:' + PORT);
});