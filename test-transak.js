const fs = require('fs');

async function test() {
  const env = fs.readFileSync('/home/danivargashermosa/web3/biotaProtocol_UBI/biotaScrow/.env', 'utf8');
  const apiKey = env.match(/NEXT_PUBLIC_TRANSAK_API_KEY=(.*)/)?.[1].trim();
  const apiSecret = env.match(/TRANSAK_API_SECRET=(.*)/)?.[1].trim();

  if (!apiKey || !apiSecret) {
    console.log("Missing keys");
    return;
  }

  // 1. Get Token
  const tokenRes = await fetch('https://api.transak.com/partners/api/v2/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-secret': apiSecret },
    body: JSON.stringify({ apiKey })
  });
  
  const tokenData = await tokenRes.json();
  const token = tokenData.data?.accessToken;
  console.log("Token Fetched:", !!token);

  if (!token) {
    console.log("Token Data:", tokenData);
    return;
  }

  // 2. Test Gateway Auth Session
  const sessionRes = await fetch('https://api-gateway.transak.com/api/v2/auth/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': token,
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ widgetParams: { apiKey, environment: 'PRODUCTION' } })
  });
  console.log("Session Res (Gateway):", sessionRes.status, await sessionRes.text());

  // 3. Test API Auth Session (Alternative)
  const sessionRes2 = await fetch('https://api.transak.com/api/v2/auth/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': token
    },
    body: JSON.stringify({ widgetParams: { apiKey, environment: 'PRODUCTION' } })
  });
  console.log("Session Res (Direct):", sessionRes2.status, await sessionRes2.text());
}
test();
