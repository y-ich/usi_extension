// (C) 2021 ICHIKAWA, Yuji
// License: MIT

try {
    importScripts("./kif.js");
} catch (e) {
    console.log(e);
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
        this.issue("stop");
        this.issue("quit");
        setTimeout(() => {
            this.port.disconnect();
        }, 100);
    }
}

class Updater {
    constructor(tab, url) {
        this.tab = tab;
        this.url = url;
        this.usi = null;
        this.textDecoder = new TextDecoder("shift-jis");
        chrome.tabs.onRemoved.addListener((tabId) => {
            if (this.tab.id === tabId) {
                this.stop();
            }
        });
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (this.tab.id === tabId && changeInfo.audible === true) {
                console.log("onUpdated", changeInfo);
                chrome.tabs.sendMessage(this.tab.id, {
                    request: "moveNumber"
                }, null);
            }
        });
    }

    async start(moveNumber) {
        this.usi = new Usi();
        await this.usi.command("usi", "usiok");
        await this.usi.command("isready", "readyok");
        this.usi.issue("usinewgame");
        await this.process(moveNumber);
    }

    stop() {
        if (this.usi != null) {
            this.usi.terminate();
            this.usi = null;
        }
    }

    async process(moveNumber) {
        try {
            const response = await fetch(this.url, { cache: "reload" });
            const data = await response.arrayBuffer();
            const kif = this.textDecoder.decode(data);
            const parsed = Parser.parseStr(kif);
            const moves = parsed[0].moves.slice(0, moveNumber);
            this.usi.issue("stop");
            this.usi.issue(`position startpos moves ${moves.join(" ")}`);
            this.usi.processMessage = (msg) => {
                const info = parse(msg);
                info.moveNumber = moves.length;
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
    console.log(message);
    switch (message.command) {
    case "think":
        const url = new URL(message.url);
        if (updater == null) {
            updater = new Updater(sender.tab, url);
            await updater.start();
        }
        await updater.process(message.moveNumber);
        break;
    case "stop":
        updater.stop();
        break;
    default:
        break;
    }
});
