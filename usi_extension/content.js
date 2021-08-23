// (C) 2021 ICHIKAWA, Yuji
// License: MIT

function scoreToWinrate(score) {
    return 1.0 / (1.0 + Math.exp(-score / 600.0));
}

function addSituationBar(container) {
    const bar = document.createElement("div");
    bar.style.position = "absolute";
    bar.style.left = "0px";
    bar.style.right = "0px";
    bar.style.margin = "auto";
    bar.style.top = "56px";
    bar.style.margin = "0 auto";
    bar.style.width = "614px";
    bar.style.height = "15px";
    bar.style.backgroundColor = "white";
    bar.style.border = "2px solid";
    const black = document.createElement("div");
    black.style.float = "right";
    black.style.width = "50%";
    black.style.height = "100%";
    black.style.backgroundColor = "black";
    bar.appendChild(black);
    container.insertBefore(bar, container.childNodes[0]);

    return [bar, black];
}

const script = document.querySelector("main > script");
for (const line of script.textContent.split("\n")) {
    const match = line.match(/const KIF_FILE_NAME = "(.*)";/);
    if (match) {
        const container = document.querySelector("div");
        const [bar, black] = addSituationBar(container);
        let thinking = false;
        bar.addEventListener("click", function(event) {
            if (thinking) {
                chrome.runtime.sendMessage({
                    command: "stop"
                });
            } else {
                const url = new URL(match[1], document.location);
                chrome.runtime.sendMessage({
                    command: "think",
                    url: url.toString()
                });
            }
            thinking = !thinking;
        }, false);
        chrome.runtime.onMessage.addListener(function(message, sender, callback) {
            console.log(message);
            const winrate = scoreToWinrate(message["score cp"]) * 100;
            black.style.width = `${message.turn === "先手" ? winrate : (100 - winrate)}%`
        });
        break;
    }
}
