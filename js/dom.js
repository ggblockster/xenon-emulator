export const uploadTrigger = document.getElementById("uploadTrigger");
export const uploadEl = document.getElementById("uploadBtn");
export const gameTitleText = document.getElementById("gameName");
export const gameHero = document.getElementById("gameHero");
export const runBtn = document.getElementById("run");
export const runStatusText = document.getElementById("runStatus");
export const runStatusIcon = document.getElementById("runStatusIcon");
export const reuploadBtn = document.getElementById("reuploadRom");
export const reuploadInput = document.getElementById("reuploadInput");
export const removeGameBtn = document.getElementById("removeRom");
export const gameListEl = document.getElementById("gameList");
export const noneFound = document.getElementById("noneFound");
export const recordHours = document.getElementById("recordHours");
export const loadingBG = document.getElementById("loading");
export const favouriteBtn = document.getElementById("favourite");
export const favStateIcon = document.getElementById("favState");
export const consoleText = document.getElementById("consoleIdentity");
export const gameSearch = document.getElementById("gameSearch");
noneFound.hidden = true;

// adds a game to the ui list
export function addGameToList(game) {
    const li = document.createElement("li");

    li.dataset.sha256 = game.sha256;
    li.dataset.filename = game.filename;
    li.title = game.filename;
    li.classList.add("listROM");

    if (game.missing)
        li.classList.add("missing");

    const img = document.createElement("img");
    img.src = "/assets/img/avatarBlank.svg";
    const text = document.createElement("span");
    text.textContent = game.filename;

    li.append(
        img,
        text
    );

    gameListEl.appendChild(li);
    updateEmptyState();
}

// updates rom local state
export function markRomInstalled(sha256) {
    const li = gameListEl.querySelector(
        `[data-sha256="${sha256}"]`
    );
    if (!li)
        return;
    li.classList.remove("missing");
}

// updates display
export function showGameDetails(rom) {
    gameTitleText.textContent =
        rom.title ??
        rom.filename.replace(/\.[^.]+$/, "");

    gameTitleText.classList.remove("ital");
    gameHero.src =
        "/assets/img/avatarBlank.svg";

    runStatusText.textContent = "Play";
    runStatusIcon.textContent = "play_arrow";
}


// applies play button state refresh
export function updateRunButton(
    selectedRom,
    emulatorWindow
) {
    const running =
        emulatorWindow &&
        !emulatorWindow.closed;


    runBtn.disabled =
        !selectedRom ||
        running;
}


// Empty collection message
export function updateEmptyState() {
    noneFound.hidden =
        gameListEl.children.length > 0;
}

gameSearch.addEventListener("input", () => {
    const search = gameSearch.value.trim().toLowerCase();

    const listROM = document.querySelectorAll(".listROM");
    listROM.forEach(li => {
        const title = li.title.toLowerCase();
        const filename = li.dataset.filename.toLowerCase();
        li.hidden = !title.includes(search) && !filename.includes(search);
    });
});

