const uploadTrigger = document.getElementById("uploadTrigger");
const uploadEl = document.getElementById("uploadBtn");
const gameTitleText = document.getElementById("gameName");
const gameHero = document.getElementById("gameHero");
const runBtn = document.getElementById("run")
const runStatusText = document.getElementById("runStatus");
const runStatusIcon = document.getElementById("runStatusIcon");

const gameListEl = document.getElementById("gameList");
const noneFound = document.getElementById("noneFound");
noneFound.hidden = true;

import {
    saveRom,
    loadRom,
    loadAllRoms
} from "./idb.js";
import { supabase } from "./server.js";

async function rpc(fn, args) {
    const {
        data: { session }
    } = await supabase.auth.getSession();

    if (!session)
        return;

    const { error } = await supabase.rpc(fn, args);

    if (error)
        console.error(error);
}

const cloud = {
    addGame: (sha256, filename) =>
        rpc("add_game", {
            game_hash: sha256,
            filename
        }),

    removeGame: sha256 =>
        rpc("remove_game", {
            game_hash: sha256
        }),

    addPlaytime: (sha256, seconds) =>
        rpc("add_playtime", {
            game_hash: sha256,
            seconds
        }),

    favourite: (sha256, value) =>
        rpc("set_favourite", {
            game_hash: sha256,
            value
        }),

    savefile: (sha256, path) =>
        rpc("set_savefile", {
            game_hash: sha256,
            savefile_path: path
        })
};

async function syncCollection() {
    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user)
        return;

    const { data: profile, error } =
        await supabase
            .from("profiles")
            .select("collection")
            .eq("uuid", user.id)
            .single();

    if (error) {
        console.error("Profile sync failed:", error);
        return;
    }

    const cloudGames =
        profile.collection?.games ?? {};

    const local =
        await loadAllRoms();

    for (const rom of local) {
        if (!cloudGames[rom.sha256]) {
            await cloud.addGame(
                rom.sha256,
                rom.filename
            );
        }
    }
}

uploadTrigger.addEventListener("click", () => {
    uploadEl.click();
});

uploadEl.addEventListener("change", async () => {
    try {
        const file = uploadEl.files[0];
        if (!file) return;

        const sha256 = await hashFile(file);

        await saveRom({
            sha256,
            file,
            filename: file.name,
            size: file.size,
            added: Date.now()
        });

        await cloud.addGame(
            sha256,
            file.name
        );

        addGameToList({
            sha256,
            filename: file.name
        });

    } catch (err) {
        console.error(err);
    } finally {
        uploadEl.value = "";
    }
});

function addGameToList(game) {
    const li = document.createElement("li");
    li.dataset.sha256 = game.sha256;

    li.innerHTML = `
        <img src="/assets/img/avatarBlank.svg">
        ${game.title || game.filename}`;
    li.title = game.title || game.filename

    gameListEl.appendChild(li);
}

gameListEl.addEventListener("click", async (e) => {
    const li = e.target.closest("li");
    if (!li) return;

    // Remove previous selection
    gameListEl
        .querySelector(".selected")
        ?.classList.remove("selected");

    // Select this item
    li.classList.add("selected");

    const rom = await loadRom(li.dataset.sha256);

    selectedRom = rom;
    const core = getCore(rom.filename);
    showGameDetails(rom);
    updateRunButton();
});

function showGameDetails(rom) {
    gameTitleText.textContent =
        rom.title ?? rom.filename.replace(/\.[^.]+$/, "");
    gameTitleText.classList.remove("ital");
    gameHero.src = "/assets/img/avatarBlank.svg";
    runStatusText.textContent = "Play";
    runStatusIcon.textContent = "play_arrow";
}

(async () => {
    const roms = await loadAllRoms();
    roms.sort((a, b) =>
        a.filename.localeCompare(b.filename)
    );

    for (const rom of roms) {
        addGameToList(rom);
    }

    await syncCollection();
})();

async function hashFile(file) {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return [...new Uint8Array(hashBuffer)]
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

let emulatorWindow = null;
let selectedRom = null;

function updateRunButton() {
    const running = emulatorWindow && !emulatorWindow.closed;

    runBtn.disabled = !selectedRom || running;
}


runBtn.addEventListener("click", () => {
    if (!selectedRom) return;

    const romUrl = URL.createObjectURL(selectedRom.file);
    const gameCore = getCore(selectedRom.filename);
    const gameName = selectedRom.filename.replace(/\.[^.]+$/, "");
    const gameIcon = "/assets/img/avatarBlank.svg";

    if (!gameCore) {
        console.error("No emulator core found for:", selectedRom.filename);
        URL.revokeObjectURL(romUrl);
        return;
    }

    const templateHTML = `
        <!doctype html>
        <html>
        <head>
            <title>${gameName}</title>
            <link rel="shortcut icon" href="${gameIcon}" type="image/x-icon">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

            <style>
                html, body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    font-family: "Inter", sans-serif;
                }

                * {
                    font-family: "Inter", sans-serif !important;
                }
            </style>
        </head>

        <body>
            <div style="width:100%;height:100%">
                <div id="game"></div>
            </div>

            <script>
                EJS_player = "#game";
                EJS_core = ${JSON.stringify(gameCore)};
                EJS_gameName = ${JSON.stringify(gameName)};
                EJS_gameUrl = ${JSON.stringify(romUrl)};

                EJS_color = "#c47a6d";
                EJS_backgroundColor = "#1a1d29";

                EJS_startOnLoaded = false;
                EJS_alignStartButton = 'center';

                EJS_pathtodata = "https://cdn.emulatorjs.org/4.2.3/data/";

                // Requires COOP/COEP headers, disabled for now
                EJS_threads = false;

                EJS_language = "en-US";

                EJS_loadStateURL = "";

                EJS_Buttons = {
                    playPause: true,
                    restart: true,
                    mute: true,
                    settings: true,
                    fullscreen: true,
                    saveState: true,
                    loadState: true,
                    screenRecord: false,
                    gamepad: true,
                    cheat: false,
                    volume: true,
                    saveSavFiles: true,
                    loadSavFiles: true,
                    quickSave: false,
                    quickLoad: false,
                    screenshot: true,
                    cacheManager: false,
                    exitEmulation: false
                };

                EJS_onGameStart = () => {
                    setTimeout(() => {
                        const audio = document.querySelector("audio");

                        if (audio) {
                            audio.volume = 0.25; // 25%
                        }
                    }, 1000);
                };
            </script>

            <script src="https://cdn.emulatorjs.org/4.2.3/data/loader.js"></script>
        </body>
        </html>`;

    const popupWidth = 640;
    const popupHeight = 360;
    const popupLeft =
        window.screenX + (window.outerWidth - popupWidth) / 2;

    const popupTop =
        window.screenY + (window.outerHeight - popupHeight) / 2;
    const started = Date.now();
    const popup = window.open(
        "",
        "emulator",
        `popup,width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop}`
    );
    emulatorWindow = popup;

    if (!popup) {
        console.error("Popup blocked");
        URL.revokeObjectURL(romUrl);
        return;
    }

    popup.document.open();
    popup.document.write(templateHTML);
    popup.document.close();

    updateRunButton();

    watchEmulatorWindow(
        selectedRom.sha256,
        started,
        romUrl
    );
});

async function watchEmulatorWindow(
    sha256,
    started,
    romUrl
) {
    const timer = setInterval(async () => {

        if (!emulatorWindow || emulatorWindow.closed) {

            clearInterval(timer);

            URL.revokeObjectURL(romUrl);

            emulatorWindow = null;

            updateRunButton();

            const seconds =
                Math.floor(
                    (Date.now() - started) / 1000
                );

            if (seconds > 0) {
                await cloud.addPlaytime(
                    sha256,
                    seconds
                );
            }
        }

    }, 500);
}

function getCore(filename) {
    const ext = filename.split(".").pop().toLowerCase();

    switch (ext) {
        // Game Boy
        case "gb":
        case "gbc":
            return "gb";

        // Game Boy Advance
        case "gba":
            return "gba";

        // Nintendo Entertainment System
        case "nes":
        case "fds":
        case "unf":
        case "unif":
            return "nes";

        // Super Nintendo
        case "smc":
        case "sfc":
        case "snes":
        case "fig":
        case "swc":
        case "bsx":
            return "snes";

        // Nintendo 64
        case "n64":
        case "z64":
        case "v64":
            return "n64";

        // Nintendo DS
        case "nds":
            return "nds";

        // Nintendo 3DS
        case "3ds":
        case "3dsx":
        case "cci":
        case "cxi":
            return "3ds";

        // Virtual Boy
        case "vb":
        case "vboy":
            return "vb";

        // Sega Master System
        case "sms":
            return "sms";

        // Sega Game Gear
        case "gg":
            return "gg";

        // Sega Mega Drive / Genesis
        case "gen":
        case "md":
        case "smd":
            return "segaMD";

        // Sega 32X
        case "32x":
            return "sega32x";

        // PC Engine / TurboGrafx-16
        case "pce":
            return "pce";

        // WonderSwan
        case "ws":
            return "ws";

        // WonderSwan Color
        case "wsc":
            return "wsc";

        // Neo Geo Pocket
        case "ngp":
            return "ngp";

        // Atari 2600
        case "a26":
            return "atari2600";

        // Atari 5200
        case "a52":
            return "atari5200";

        // Atari 7800
        case "a78":
            return "atari7800";

        // Atari 8-bit
        case "atr":
        case "atx":
        case "cas":
        case "xex":
            return "atari800";

        // Atari Lynx
        case "lnx":
            return "lynx";

        // Atari Jaguar
        case "jag":
            return "jaguar";

        // ColecoVision
        case "col":
            return "coleco";

        // MSX
        case "mx1":
            return "msx";

        // MSX2
        case "mx2":
            return "msx2";

        // Atari ST
        case "st":
        case "msa":
        case "stx":
        case "dim":
        case "ipf":
            return "atarist";

        // Commodore 64
        case "d64":
        case "d71":
        case "d81":
        case "g64":
        case "t64":
        case "tap":
        case "prg":
        case "p00":
        case "crt":
            return "c64";

        // PC-98
        case "d88":
        case "fdi":
        case "fdd":
        case "hdm":
        case "hdf":
        case "hdi":
        case "xdf":
            return "pc98";

        // PC-88
        case "n88":
        case "t88":
            return "pc88";

        // Amiga
        case "adf":
        case "adz":
        case "dms":
            return "amiga";

        // PlayStation
        case "ccd":
        case "cue":
        case "img":
        case "mds":
        case "pbp":
            return "psx";

        default:
            return null;
    }
}

setInterval(() => {
    if (gameListEl.children.length > 0) {
        noneFound.hidden = true;
    } else {
        noneFound.hidden = false;
    }
}, 100);
