// (C) 2021 ICHIKAWA, Yuji
// License: MIT

function scoreToWinrate(score) {
    return 1.0 / (1.0 + Math.exp(-score / 600.0));
}

function addSituationBar(container) {
    const bar = document.createElement("div");
    bar.id = "usi-extension-bar";
    const white = document.createElement("div");
    white.textContent = "50%";
    bar.appendChild(white);
    const black = document.createElement("div");
    black.textContent = "50%";
    bar.appendChild(black);
    container.insertBefore(bar, container.childNodes[0]);

    return [bar, white, black];
}

const script = document.querySelector("main > script");
for (const line of script.textContent.split("\n")) {
    const match = line.match(/const KIF_FILE_NAME = "(.*)";/);
    if (match) {
        const container = document.querySelector("div");
        const [bar, white, black] = addSituationBar(container);
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
            bar.classList.toggle("thinking");
        }, false);
        chrome.runtime.onMessage.addListener(function(message, sender, callback) {
            console.log(message);
            const winrate = Math.round(scoreToWinrate(message["score cp"]) * 100);
            if (message.turn === "先手") {
                white.textContent = `${100 - winrate}%`;
                white.style.width = `${100 - winrate}%`;
                black.textContent = `${winrate}%`;
                black.style.width = `${winrate}%`;
            } else {
                white.textContent = `${winrate}%`;
                white.style.width = `${winrate}%`;
                black.textContent = `${100 - winrate}%`;
                black.style.width = `${100 - winrate}%`;
            }
        });
        break;
    }
}
