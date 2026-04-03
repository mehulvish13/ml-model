const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DATA_FILE = path.join(ROOT_DIR, "entries.json");

function ensureDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify({ mehul: [], akhilesh: [] }, null, 2),
            "utf8"
        );
    }
}

function readEntries() {
    ensureDataFile();

    try {
        const raw = fs.readFileSync(DATA_FILE, "utf8");
        const parsed = JSON.parse(raw);

        return {
            mehul: Array.isArray(parsed.mehul) ? parsed.mehul : [],
            akhilesh: Array.isArray(parsed.akhilesh) ? parsed.akhilesh : []
        };
    } catch (error) {
        const emptyEntries = { mehul: [], akhilesh: [] };
        fs.writeFileSync(DATA_FILE, JSON.stringify(emptyEntries, null, 2), "utf8");
        return emptyEntries;
    }
}

function writeEntries(entries) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), "utf8");
}

function sendJson(response, statusCode, data) {
    response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8"
    });
    response.end(JSON.stringify(data));
}

function sendText(response, statusCode, text, contentType = "text/plain; charset=utf-8") {
    response.writeHead(statusCode, {
        "Content-Type": contentType
    });
    response.end(text);
}

function serveStaticFile(response, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8"
    };

    try {
        const content = fs.readFileSync(filePath);
        response.writeHead(200, {
            "Content-Type": contentTypeMap[ext] || "application/octet-stream"
        });
        response.end(content);
    } catch (error) {
        sendText(response, 404, "Not found");
    }
}

ensureDataFile();

const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if (requestUrl.pathname === "/api/entries" && request.method === "GET") {
        sendJson(response, 200, readEntries());
        return;
    }

    if (requestUrl.pathname === "/api/entries" && request.method === "POST") {
        let body = "";

        request.on("data", (chunk) => {
            body += chunk;
        });

        request.on("end", () => {
            try {
                const parsed = JSON.parse(body || "{}");
                const profile = parsed.profile;
                const entry = parsed.entry;
                const entries = readEntries();

                if (!entries[profile] || !entry) {
                    sendJson(response, 400, { error: "Invalid entry data" });
                    return;
                }

                entries[profile].push(entry);
                writeEntries(entries);
                sendJson(response, 200, entries);
            } catch (error) {
                sendJson(response, 400, { error: "Invalid JSON body" });
            }
        });

        return;
    }

    const fileMap = {
        "/": path.join(ROOT_DIR, "index.html"),
        "/index.html": path.join(ROOT_DIR, "index.html"),
        "/style.css": path.join(ROOT_DIR, "style.css"),
        "/app.js": path.join(ROOT_DIR, "app.js")
    };

    const staticFilePath = fileMap[requestUrl.pathname];

    if (staticFilePath) {
        serveStaticFile(response, staticFilePath);
        return;
    }

    sendText(response, 404, "Not found");
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
