// このスクリプトは、python-shogi(https://github.com/gunyarakun/python-shogi)のKIF.pyの移植です
// (C) 2021 ICHIKAWA, Yuji
// License: MIT

function splitext(str) {
    const i = str.lastIndexOf(".");
    return [str.slice(0, i), str.slice(i)]
}

function count(target, str) {
    let n = 0;
    while (true) {
        const i = str.indexOf(target);
        if (i < 0) {
            return n;
        }
        n += 1;
        str = str.slice(i + 1);
    }
}

function rtrim(x, characters) {
    var start = 0;
    var end = x.length - 1;
    while (characters.indexOf(x[end]) >= 0) {
      end -= 1;
    }
    return x.substr(0, end + 1);
}

const shogi = {
    BLACK: 0,
    WHITE: 1,
    NUMBER_JAPANESE_NUMBER_SYMBOLS: [
        '０', '１', '２', '３', '４',
        '５', '６', '７', '８', '９'
    ],
    NUMBER_JAPANESE_KANJI_SYMBOLS: [
        '零', '一', '二', '三', '四',
        '五', '六', '七', '八', '九',
        '十', '十一', '十二', '十三', '十四',
        '十五', '十六', '十七', '十八'
    ],
    SQUARE_NAMES: [
        '9a', '8a', '7a', '6a', '5a', '4a', '3a', '2a', '1a',
        '9b', '8b', '7b', '6b', '5b', '4b', '3b', '2b', '1b',
        '9c', '8c', '7c', '6c', '5c', '4c', '3c', '2c', '1c',
        '9d', '8d', '7d', '6d', '5d', '4d', '3d', '2d', '1d',
        '9e', '8e', '7e', '6e', '5e', '4e', '3e', '2e', '1e',
        '9f', '8f', '7f', '6f', '5f', '4f', '3f', '2f', '1f',
        '9g', '8g', '7g', '6g', '5g', '4g', '3g', '2g', '1g',
        '9h', '8h', '7h', '6h', '5h', '4h', '3h', '2h', '1h',
        '9i', '8i', '7i', '6i', '5i', '4i', '3i', '2i', '1i',
    ],
    PIECE_SYMBOLS: ['',   'p',  'l',  'n',  's', 'g',  'b',  'r', 'k',
    '+p', '+l', '+n', '+s',      '+b', '+r'],
    PIECE_JAPANESE_SYMBOLS: [
        '',
        '歩', '香', '桂', '銀', '金', '角', '飛',
        '玉', 'と', '杏', '圭', '全', '馬', '龍'
    ],
    STARTING_SFEN: "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1"
};

class Parser {
    static MOVE_RE = /^ *[0-9]+\s+(中断|投了|持将棋|先日手|詰み|切れ負け|反則勝ち|反則負け|(([１２３４５６７８９])([零一二三四五六七八九])|同　)([歩香桂銀金角飛玉と杏圭全馬龍])(打|(成?)\(([0-9])([0-9])\)))\s*(\([ /:0-9]+\))?\s*$/;

    static HANDYCAP_SFENS = {
        "平手": shogi.STARTING_SFEN,
        "香落ち": "lnsgkgsn1/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1",
        "右香落ち": "1nsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1",
        "角落ち": "lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1",
        "飛車落ち": "lnsgkgsnl/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1",
        "飛香落ち": "lnsgkgsn1/7b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1",
        "二枚落ち": "lnsgkgsnl/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1",
        "三枚落ち": "lnsgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1",
        "四枚落ち": "1nsgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1",
        "五枚落ち": "2sgkgsn1/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1",
        "左五枚落ち": "1nsgkgs2/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1",
        "六枚落ち": "2sgkgs2/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1",
        "八枚落ち": "4k4/9/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1",
        "その他": null
    };
    
    static RESULT_RE = /　*まで(\d+)手で((先|下|後|上)手の勝ち|千日手|持将棋|中断)/;
    
    static parseFile(path) {
        const [prefix, ext] = splitext(path);
        for (const enc of ["cp932", "utf-8-sig"]) {
            try {
                const f = codecs.open(path, "r", enc);
                return Parser.parseStr(f.read());
            } catch (e) {
                console.log(e);
            }
        }
        return null;
    }

    static parsePiecesInHand(target) {
        if (target === "なし") { // None in japanese
            return new Map();
        }

        const result = new Map();
        for (const item of target.split("　")) {
            switch (item.length) {
            case 1:
                result[shogi.PIECE_JAPANESE_SYMBOLS.index(item)] = 1;
                break;
            case 2,3:
                result[shogi.PIECE_JAPANESE_SYMBOLS.index(item[0])] = shogi.NUMBER_JAPANESE_KANJI_SYMBOLS.index(item.slice(1));
                break;
            case 0:
                break;
            default:
                throw new Error("Invalid pieces in hand");
            }
        }
        return result;
    }

    static parseBoardLine(line) {
        const board_line = line.split("|")[1].replace(" ", "");
        let line_sfen = "";
        let square_skip = 0;
        let sente = true;

        for (const square of board_line) {
            // if there is a piece in the square (no dot)
            if (square !== "・") {
                // if there is a square skip, add to sfen
                if (square_skip > 0) {
                    line_sfen += square_skip.toString();
                    square_skip = 0;
                }

                if (square === "v") {
                    sente = false;
                    continue
                }

                // get the piece roman symbol
                const piece = shogi.PIECE_SYMBOLS[shogi.PIECE_JAPANESE_SYMBOLS.index(square[-1])];

                // if sente
                if (sente) {
                    line_sfen += piece.upper();
                } else {
                    line_sfen += piece.lower();
                }
                sente = true;
            } else {
                square_skip += 1;
            }
        }

        // if last square is also empty, need to add the skip to the end
        if (square_skip > 0) {
            line_sfen += square_skip.toString();
        }

        return line_sfen;
    }
    
    static completeCustomSfen(board, pieces_in_hand, turn) {
        const turn_str = turn === shogi.BLACK ? "b" : "w";

        // add whos turn it is
        let sfen = board + " " + turn_str + " ";

        // if there are pieces in the hand
        if (sum(pieces_in_hand[shogi.BLACK].values()) + sum(pieces_in_hand[shogi.WHITE].values())) {
            for (const [key, quantity] of pieces_in_hand[shogi.BLACK].items()) {
                const piece = shogi.PIECE_SYMBOLS[key].upper();
                if (quantity > 1) {
                    sfen += quantity.toString() + piece;
                } else if (quantity == 1) {
                    sfen += piece;
                }
            }
            for (const [key, quantity] of pieces_in_hand[shogi.WHITE].items()) {
                const piece = shogi.PIECE_SYMBOLS[key].lower();
                sfen += quantity.toString() + piece;
            }
        } else {
            sfen += "-";
        }

        // add the initial move number
        sfen += " 1";

        return sfen;
    }

    static parseMoveStr(line, last_to_square) {
        // Normalize king/promoted kanji
        line = line.replace("王", "玉");
        line = line.replace("竜", "龍");
        line = line.replace("成銀", "全");
        line = line.replace("成桂", "圭");
        line = line.replace("成香", "杏");

        const m = line.match(Parser.MOVE_RE);
        if (m) {
            if ([
                    "中断",
                    "投了",
                    "持将棋",
                    "千日手",
                    "詰み",
                    "切れ負け",
                    "反則か勝ち",
                    "反則負け"
            ].includes(m[1])) {
                return [
                    null,
                    null,
                    m[1]
                ];
            }

            const piece_type = shogi.PIECE_JAPANESE_SYMBOLS.indexOf(m[5]);
            let to_square;
            let to_field;
            let to_rank;
            if (m[2] === "同　") {
                // same position
                to_square = last_to_square;
            } else {
                to_field = 9 - shogi.NUMBER_JAPANESE_NUMBER_SYMBOLS.indexOf(m[3]);
                to_rank = shogi.NUMBER_JAPANESE_KANJI_SYMBOLS.indexOf(m[4]) - 1;
                to_square = to_rank * 9 + to_field;
                last_to_square = to_square;
            }

            if (m[6] === "打") {
                // piece drop
                return [
                    `${shogi.PIECE_SYMBOLS[piece_type].toUpperCase()}*${shogi.SQUARE_NAMES[to_square]}`,
                    last_to_square,
                    null
                ];
            } else {
                const from_field = 9 - parseInt(m[8]);
                const from_rank = parseInt(m[9]) - 1;
                const from_square = from_rank * 9 + from_field;

                const promotion = m[7] === "成";
                return [
                    shogi.SQUARE_NAMES[from_square] + shogi.SQUARE_NAMES[to_square] + (promotion ? "+" : ""),
                    last_to_square,
                    null
                ];
            }
        }
        return [null, last_to_square, null];
    }

    static parseStr(kif_str) {
        let line_no = 1;

        const names = [null, null];
        const pieces_in_hand = [new Map(), new Map()];
        let current_turn = shogi.BLACK;
        let sfen = shogi.STARTING_SFEN;
        const moves = [];
        let last_to_square = null;
        let win = null;
        let custom_sfen = false;
        kif_str = kif_str.replace("\r\n", "\n").replace("\r", "\n");
        for (const line of kif_str.split("\n")) {
            if (line.length === 0 || line[0] === "*") {
                continue;
            }
            if (count("+", line) === 2 && count("-", line) > 10) {
                if (custom_sfen) {
                    custom_sfen = false;
                    // remove last slash
                    sfen = sfen.slice(0, -1);
                } else {
                    custom_sfen = true;
                    sfen = "";
                }
            } else if (custom_sfen) {
                sfen += Parser.parseBoardLine(line) + "/";
            } else if (line.includes("：")) {
                let [key, value] = line.split("：", 2);
                // value = rtrim(value, "　 "); // 動かない
                value = value.trim();
                if (key === "先手" || key === "下手") { // sente or shitate
                    // Blacks"s name
                    names[shogi.BLACK] = value;
                } else if (key === "後手" || key === "上手") { // gote or uwate
                    // White"s name
                    names[shogi.WHITE] = value;
                } else if (key === "先手の持駒" || key === "下手の持駒") { // sente or shitate's pieces in hand
                    // First player's pieces in hand
                    pieces_in_hand[shogi.BLACK] = Parser.parsePiecesInHand(value);
                } else if (key === "後手の持駒" || key === "上手の持駒") { // gote or uwate's pieces in hand
                    // Second player's pieces in hand
                    pieces_in_hand[shogi.WHITE] = Parser.parsePiecesInHand(value);
                } else if (key === "手合割") { // teai wari
                    sfen = Parser.HANDYCAP_SFENS[value];
                    if (sfen == null) {
                        console.log(key, `^${value}$`, value.length);
                        throw new Error('Cannot support handycap type "other"');
                    }
                }
            } else if (line === "後手番") {
                // Current turn is white
                current_turn = shogi.WHITE;
            } else {
                let move;
                let special_str;
                [move, last_to_square, special_str] = Parser.parseMoveStr(line, last_to_square);
                if (move != null) {
                    moves.push(move);
                    if (current_turn === shogi.BLACK) {
                        current_turn = shogi.WHITE;
                    } else { // current_turn == shogi.WHITE
                        current_turn = shogi.BLACK;
                    }
                } else if (["投了", "詰み", "切れ負け", "反則負け"].includes(special_str)) {
                    if (current_turn == shogi.BLACK) {
                        win = "w";
                    } else { // current_turn == shogi.WHITE
                        win = "b";
                    }
                } else if (["反則勝ち", "入玉勝ち"].includes(special_str)) {
                    if (current_turn === shogi.BLACK) {
                        win = "b";
                    } else { // current_turn == shogi.WHITE
                        win = "w";
                    }
                } else if (["持将棋", "先日手"].includes(special_str)) {
                    win = "-";
                } else {
                    const m = line.match(Parser.RESULT_RE);
                    if (m) {
                        const win_side_str = m[3];
                        if (win_side_str === "先" || win_side_str === "下") {
                            win = "b";
                        } else if (win_side_str === "後" || win_side_str === "上") {
                            win = "w";
                        } else {
                            // TODO: repetition of moves with continuous check
                            win = "-";
                        }
                    }
                }
            }
            line_no += 1;
        }

        // if using a custom sfen
        if (sfen.split(" ").length == 1) {
            sfen = Parser.completeCustomSfen(sfen, pieces_in_hand, current_turn);
        }

        const summary = {
            "names": names,
            "sfen": sfen,
            "moves": moves,
            "win": win
        };

        // NOTE: for the same interface with CSA parser
        return [summary];
    }
}
