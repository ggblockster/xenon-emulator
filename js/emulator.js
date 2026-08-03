import { getCore } from "./cores.js";
import { cloud } from "./cloud.js";

let emulatorWindow = null;

export function runGame(rom) {
    const romUrl = URL.createObjectURL(rom.file);
    const gameCore = getCore(rom.filename);

    if (!gameCore) {
        console.error(
            "No emulator core found:",
            rom.filename
        );
        URL.revokeObjectURL(romUrl);
        return;
    }

    const gameName =
        rom.filename.replace(/\.[^.]+$/, "");

    const width = 640;
    const height = 360;

    const left =
        window.screenX +
        (window.outerWidth - width) / 2;

    const top =
        window.screenY +
        (window.outerHeight - height) / 2;

    const started = Date.now();

    const popup = window.open(
        "",
        "emulator",
        `popup,width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
        URL.revokeObjectURL(romUrl);
        return;
    }

    emulatorWindow = popup;

    popup.document.open();
    popup.document.write(
        createEmulatorHTML({
            gameCore,
            gameName,
            romUrl
        })
    );
    popup.document.close();

    watchEmulatorWindow(
        rom.sha256,
        started,
        romUrl
    );
}

export function isEmulatorRunning() {
    return emulatorWindow &&
        !emulatorWindow.closed;
}


function createEmulatorHTML({
    gameCore,
    gameName,
    romUrl
}) {
    const threaded =
        gameCore === "azahar";

    return `
<!doctype html>
<html>
<head>
<title>${gameName}</title>
<link rel="shortcut icon" href="/assets/img/avatarBlank.svg">

<style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
html, body {
    margin:0;
    padding:0;
    width:100vw;
    height:100vh;
    font-family: "Inter" !important;
}

#game {
    width:100%;
    height:100vh;
    font-family: "Inter" !important;
}
* {
    margin: 0;
    padding: 0;
    font-family: "Inter" !important;
}
</style>
</head>

<body>
<div id="game"></div>

<script>
EJS_player = "#game";
EJS_core = ${JSON.stringify(gameCore)};
EJS_gameName = ${JSON.stringify(gameName)};
EJS_gameUrl = ${JSON.stringify(romUrl)};

EJS_color = "#c47a6d";
EJS_backgroundColor = "#1a1d29";

EJS_startOnLoaded = false;
EJS_alignStartButton = "center";

EJS_pathtodata =
"https://cdn.emulatorjs.org/4.2.3/data/";

EJS_threads = ${threaded};

EJS_language = "en-US";

EJS_Buttons = {
    playPause:true,
    restart:true,
    mute:true,
    settings:true,
    fullscreen:true,
    saveState:true,
    loadState:true,
    gamepad:true,
    screenshot:true
};
</script>

<script src="https://cdn.emulatorjs.org/4.2.3/data/loader.js"></script>

</body>
</html>
`;
}


function watchEmulatorWindow(
    sha256,
    started,
    romUrl
) {
    const timer = setInterval(async () => {

        if (!emulatorWindow ||
            emulatorWindow.closed) {

            clearInterval(timer);

            URL.revokeObjectURL(romUrl);

            emulatorWindow = null;

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