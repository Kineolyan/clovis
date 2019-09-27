function makeJsonResponse({body, code = 200}) {
  return {
    statusCode: code,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json"
    }
  };
}

function makeTextResponse({body, code = 200}) {
  return {
    statusCode: code,
    body,
    headers: {
      "Content-Type": "text/plain"
    }
  };
}

function handleWithSecret(payload, secret, action) {
  const provided = secret.read(payload);
  const value = secret.get(payload);
  if (provided === value) {
    action(payload)
  } else {
    payload.callback(
      null,
      {
        statusCode: 501,
        body: "Internal error",
        headers: {
          "Content-Type": "text/plain"
        }
      });
  }
}

module.exports = {
  handleWithSecret,
  makeJsonResponse,
  makeTextResponse
};
