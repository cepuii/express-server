const express = require("express");
const axios = require("axios");
const { parse } = require("url");

const app = express();
const port = 3333;

async function getAccessToken(){
  
  const client_id = "0GIvkCltVIuPkkwSJHp6NDb3s0potTjLBQr388Dd";
  const apiBase = "https://api.beatport.com/v4";
  const redirect_uri = `${apiBase}/auth/o/post-message/`;
  const loginUrl = `${apiBase}/auth/login/`;
  const authorizeUrl = `${apiBase}/auth/o/authorize/`;
  const username = "label_access";
  const password = "qweasd123";
  
  try {
    // Step 1: Simulate user login (replace with actual authentication logic)
    const s = axios.create({
      withCredentials: true,
    });

    let cookieCsrf = "";
    let sessionid = "";

    s.interceptors.response.use((response) => {
      if (response.headers["set-cookie"]) {
        cookieCsrf = response.headers["set-cookie"]
          .find((cookie) => cookie.includes("csrftoken"))
          .split(";")[0];
        sessionid = response.headers["set-cookie"]
          .find((cookie) => cookie.includes("sessionid"))
          .split(";")[0];
      }
      return response;
    });

    const response = await s.post(loginUrl, {
      username: username,
      password: password,
    });

    // Step 2: Fetch authorization code
    const authorizeResponse = await s.get(authorizeUrl, {
      headers: {
        Cookie: `"${cookieCsrf}; ${sessionid};"`,
      },
      params: {
        response_type: "code",
        client_id: client_id,
        redirect_uri: redirect_uri,
      },
      withCredentials: true,
      maxRedirects: 0,
      validateStatus: (status) => status === 302,
    });

    const nextUrl = parse(authorizeResponse.headers.location, true);
    const authCode = nextUrl.query.code;
    console.log(`Authorization code: ${authCode}`);

    const tokenResponse = await s.post(
      `https://api.beatport.com/v4/auth/o/token/?client_id=${client_id}&code=${authCode}&grant_type=authorization_code&redirect_uri=${redirect_uri}`,
      {
        headers: {
          Cookie: `"${cookieCsrf}; ${sessionid};"`,
        },
        withCredentials: true,
      }
    );

    const tokenData = tokenResponse.data;
    console.log(
      "Exchanged authorization code for the access token:",
      JSON.stringify(tokenData)
    );
    return tokenData;
    
  } catch (error) {
    console.error("Error authorizing:", error.message);
  }
}

app.get("/token", async (req, res) => {
  const accessToken = await getAccessToken();
  res.send(accessToken);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
