const uploadTrigger = document.getElementById("uploadTrigger");
const uploadEl = document.getElementById("uploadBtn");
const gameTitleText = document.getElementById("gameName");
const gameHero = document.getElementById("gameHero");
const runBtn = document.getElementById("run")
const runStatusText = document.getElementById("runStatus");
const runStatusIcon = document.getElementById("runStatusIcon");

const gameListEl = document.getElementById("gameList");

import {
    saveRom,
    loadRom,
    loadAllRoms
} from "./idb.js";

uploadTrigger.addEventListener("click", () => {
    uploadEl.click();
});

uploadEl.addEventListener("change", async () => {
    try {
        const file = uploadEl.files[0];
        if (!file) return;

        console.log("1. File selected");

        const sha256 = await hashFile(file);
        console.log("2. Hash:", sha256);

        await saveRom({
            sha256,
            file,
            filename: file.name,
            size: file.size,
            added: Date.now()
        });
        console.log("3. Saved");

        addGameToList({
            sha256,
            filename: file.name
        });
        console.log("4. Added to UI");

    } catch (err) {
        console.error(err);
    } finally {
        uploadEl.value = "";
    }
});

function addGameToList(game) {
    console.log("Creating element:", game);

    const li = document.createElement("li");

    li.dataset.sha256 = game.sha256;

    li.innerHTML = `
        <img src="/assets/img/avatarBlank.svg">
        ${game.title || game.filename}`;
    li.title = game.title || game.filename

    gameListEl.appendChild(li);

    console.log(gameListEl.children.length);
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
    console.log(core);
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

    console.log("ROMs:", roms);

    roms.sort((a, b) =>
        a.filename.localeCompare(b.filename)
    );

    for (const rom of roms) {
        addGameToList(rom);
    }
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
    const popup = window.open(
        "",
        "emulator",
        `popup,width=${popupWidth},height=${popupHeight},left=${popupLeft},top=${popupTop}`
    );

    if (!popup) {
        console.error("Popup blocked");
        URL.revokeObjectURL(romUrl);
        return;
    }

    popup.document.open();
    popup.document.write(templateHTML);
    popup.document.close();

    updateRunButton();

    watchEmulatorWindow(() => {
        URL.revokeObjectURL(romUrl);
    });
});

function watchEmulatorWindow() {
    const timer = setInterval(() => {
        if (!emulatorWindow || emulatorWindow.closed) {
            clearInterval(timer);

            emulatorWindow = null;

            updateRunButton();
        }
    }, 250);
}

function getCore(filename) {
    const ext = filename.split(".").pop().toLowerCase();

    switch (ext) {
        case "gb":
        case "gbc":
            return "gb";

        case "gba":
            return "gba";

        case "nes":
        case "fds":
            return "nes";

        case "smc":
        case "sfc":
        case "snes":
            return "snes";

        case "n64":
        case "z64":
        case "v64":
            return "n64";

        case "nds":
            return "nds";

        // more

        default:
            return null;
    }
}