// (C) 2021 ICHIKAWA, Yuji
// License: MIT

function scoreToWinrate(score) {
    return 1.0 / (1.0 + Math.exp(-score / 600.0));
}

function japaneseMove(usiMove) {
    const PIECE_JAPANESE_SYMBOLS = {
        "p*": "歩",
        "l*": "香",
        "n*": "桂",
        "s*": "銀",
        "g*": "金",
        "b*": "角",
        "r*": "飛",
        "k*": "玉",
        "+p": "と",
        "+l": "杏",
        "+n": "圭",
        "+s": "全",
        "+b": "馬",
        "+r": "龍"
    };
    const OFFSET = "a".charCodeAt(0) - 1;
    const ARABICS = ["０", "１", "２", "３", "４", "５", "６", "７", "８", "９"];
    const KANJI_NUMBERS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
    if (/^[1-9]/.test(usiMove)) {
        return `${ARABICS[parseInt(usiMove[0])] + KANJI_NUMBERS[usiMove.charCodeAt(1) - OFFSET]}の駒を${ARABICS[parseInt(usiMove[2])] + KANJI_NUMBERS[usiMove.charCodeAt(3) - OFFSET]}へ`;
    } else {
        return `持ち駒${PIECE_JAPANESE_SYMBOLS[usiMove.slice(0, 2)]}を${ARABICS[parseInt(usiMove[2])] + KANJI_NUMBERS[usiMove.charCodeAt(3) - OFFSET]}へ`;
    }
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

function addEngineSelect(container) {
    const select = document.createElement("select");
    select.id = "engine-select";
    for (const e of ["水匠4改", "AobaZero"]) {
        const option = document.createElement("option");
        option.value = e;
        option.innerText = e;
        select.appendChild(option);
    }
    container.insertBefore(select, container.childNodes[1]);
    return select;
}

const script = document.querySelector("main > script");
if (script != null) {
    for (const line of script.textContent.split("\n")) {
        const match = line.match(/const KIF_FILE_NAME = "(.*)";/);
        if (match) {
            const url = new URL(match[1], document.location);
            const container = document.querySelector("div");
            const [bar, white, black] = addSituationBar(container);
            const select = addEngineSelect(container);
            const kifuList = document.getElementById("kifu_list");
            let thinking = false;
            bar.addEventListener("click", function(event) {
                if (thinking) {
                    chrome.runtime.sendMessage({
                        command: "stop"
                    });
                } else {
                    chrome.runtime.sendMessage({
                        command: "think",
                        engine: select.value,
                        url: url.toString(),
                        moveNumber: kifuList.selectedIndex
                    });
                }
                thinking = !thinking;
                bar.classList.toggle("thinking");
            }, false);
            chrome.runtime.onMessage.addListener(function(message, sender, callback) {
                if (message.request === "moveNumber") {
                    chrome.runtime.sendMessage({
                        command: "think",
                        url: url.toString(),
                        moveNumber: kifuList.selectedIndex
                    });
                } else {
                    if (!("score cp" in message && "pv" in message && "nodes" in message && "nps" in message)) {
                        return;
                    }
                    if (message["nodes"] <= 1) {
                        // message["nodes"] == 1の時のwinrateはおかしいので表示しない
                        return;
                    }
                    const winrate = Math.round(scoreToWinrate(message["score cp"]) * 100);
                    const move = japaneseMove(message["pv"][0].toLowerCase());
                    if (message.moveNumber % 2 === 0) {
                        white.textContent = `${100 - winrate}%`;
                        white.style.width = `${100 - winrate}%`;
                        black.textContent = `${winrate}% ${message.moveNumber + 1}手目 ${move} ${message["nodes"]}手`;
                        black.style.width = `${winrate}%`;
                    } else {
                        white.textContent = `${winrate}% ${message.moveNumber + 1}手目 ${move} ${message["nodes"]}手`;
                        white.style.width = `${winrate}%`;
                        black.textContent = `${100 - winrate}%`;
                        black.style.width = `${100 - winrate}%`;
                    }
                }
            });
            break;
        }
    }
}
