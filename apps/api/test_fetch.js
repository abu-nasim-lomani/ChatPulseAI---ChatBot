const http = require('http');

http.get('http://127.0.0.1:3001/messages?tenant_id=6114e75e-5fe1-4d15-b7d9-349b27b4a4a1&visitor_id=ixomf18xp', (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        console.log(JSON.stringify(JSON.parse(data), null, 2));
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
