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
    constructor(name) {
        this.processMessage = null;
        this.messages = [];
        this.port = chrome.runtime.connectNative(name);
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
        }, 1000);
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

    async start(name, moveNumber) {
        this.usi = new Usi(name);
        await this.usi.command("usi", "usiok");
        switch (name) {
        case "com.new3rs.dlshogi":
            //this.usi.issue("setoption name DNN_Model value /Users/yuji/Projects/DeepLearningShogi/coreml/DLShogi_167.mlmodel");
            this.usi.issue("setoption name DNN_Model value /Users/yuji/Projects/DeepLearningShogi/coreml/DLShogi_exhi.mlmodel");
            this.usi.issue("setoption name DNN_Batch_Size value 1");
            this.usi.issue("setoption name UCT_Threads value 1");
        default:
            break;
        }
        await this.usi.command("isready", "readyok");
        this.usi.issue("usinewgame");
        await this.process(moveNumber);
    }

    terminate() {
        if (this.usi != null) {
            this.usi.terminate();
            this.usi = null;
        }
    }

    async process(moveNumber) {
        try {
            console.log(this.url);
            const response = await fetch(this.url, { cache: "reload" });
            const data = await response.arrayBuffer();
            const kif = this.textDecoder.decode(data);
            console.log(kif);
            const parsed = Parser.parseStr(kif);
            console.log(moveNumber);
            console.log(parsed);
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
            let name;
            switch (message.engine) {
            case "DLShogi":
                name = "com.new3rs.dlshogi";
                break;
            case "AobaZero":
                name = "com.new3rs.aobazero";
                break;
            default:
                name = "com.new3rs.suisho4kai";
                break;
            }
            await updater.start(name);
        }
        await updater.process(message.moveNumber);
        break;
    case "stop":
        updater.terminate();
        updater = null;
        break;
    default:
        break;
    }
});
