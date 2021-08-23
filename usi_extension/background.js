try {
    importScripts("./kif.js");
} catch (e) {
    console.log(e);
}

function getResponse(url) {
    return new Promise(function(res, rej) {
        const req = new XMLHttpRequest();
        req.onreadystatechange = function() { 
            if (req.readyState == 4 && req.status == 200) {
                res(req.responseText);
            } else {
                rej(req.status);
            }
        }
        req.open("GET", url, true); // true for asynchronous 
        req.send(null);
    });
}

function parse(line) {
    const result = {};
    const tokens = line.split(" ");
    let token = tokens.shift();
    if (token !== "info") {
        return result;
    }
    while (true) {
        token = tokens.shift();
        if (token === "score") {
            token += " " + tokens.shift();
        }
        if (token === "pv") {
            result[token] = tokens
            break
        } else {
            result[token] = parseInt(tokens.shift());
        }
    }
    return result;
}

class Usi {
    constructor() {
        this.processMessage = null;
        this.messages = [];
        this.port = chrome.runtime.connectNative("com.new3rs.aobazero");
        this.port.onMessage.addListener((msg) => {
            console.log(msg);
            if (this.processMessage) {
                try {
                    const data = JSON.parse(msg);
                    this.processMessage(data);
                } catch (e) {
                    console.log(e, msg);
                }
            }
        });
        this.port.onDisconnect.addListener(function() {
          console.log("Disconnected");
        });
    }

    issue(command) {
        this.latestCommand = command;
        console.log(command);
        this.port.postMessage(command);
    }

    command(cmd, endPhrase) {
        return new Promise((res, rej) => {
            this.processMessage = (msg) => {
                this.messages.push(msg);
                console.log(msg, endPhrase, msg === endPhrase);
                if (msg === endPhrase) {
                    const result = this.messages;
                    this.messages = [];
                    res(result);
                }
            }
            this.issue(cmd);
        });
    }

    terminate() {
        this.issue("quit");
        this.port.disconnect();
    }
}

class Updater {
    constructor(tab, url) {
        this.tab = tab;
        this.url = url;
        this.usi = null;
        this.intervalId = null;
    }

    async start(interval) {
        this.usi = new Usi();
        await this.usi.command("usi", "usiok");
        await this.usi.command("isready", "readyok");
        this.usi.issue("usinewgame");
        await this.process();
        this.intervalId = setInterval(async () => { await this.process() }, interval);
    }

    stop() {
        if (this.intervalId != null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.usi.terminate();
        this.usi = null;
    }

    async process() {
        try {
            const response = await fetch(this.url);
            const reader = response.body.getReader();
            const data = await reader.read();
            const kif = new TextDecoder("sjis").decode(data.value);
            const parsed = Parser.parseStr(kif);
            const moves = parsed[0].moves;
            const turn = moves.length % 2 === 0 ? "先手" : "後手";
            this.usi.issue(`position startpos moves ${moves.join(" ")}`);
            this.usi.processMessage = (msg) => {
                const info = parse(msg);
                info.turn = turn;
                chrome.tabs.sendMessage(this.tab.id, info, null);
            };
            this.usi.issue("go infinite");
        } catch (e) {
            console.log(e);
            this.stop();
        }
    }
}

let updater;
chrome.runtime.onMessage.addListener(async (message,sender,sendResponse) => {
    switch (message.command) {
    case "think":
        const url = new URL(message.url);
        updater = new Updater(sender.tab, url);
        await updater.start(30000);
        break;
    case "stop":
        updater.stop();
        break;
    default:
        break;
    }
});
