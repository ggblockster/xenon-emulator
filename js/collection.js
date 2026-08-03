import {
    saveRom,
    loadRom,
    loadAllRoms,
    deleteRom
} from "./idb.js";

import { cloud, syncCollection } from "./cloud.js";
import {
    uploadTrigger,
    uploadEl,
    gameListEl,
    noneFound,
    gameTitleText,
    gameHero,
    runBtn,
    runStatusText,
    runStatusIcon,
    reuploadBtn,
    reuploadInput,
    removeGameBtn
} from "./dom.js";

import { runGame, isEmulatorRunning } from "./emulator.js";

let selectedRom = null;
let selectedSha256 = null;
let emulatorRunning = false;
noneFound.hidden = true;

uploadTrigger.addEventListener(
    "click",
    () => uploadEl.click()
);

uploadEl.addEventListener(
    "change",
    async () => {
        const file = uploadEl.files[0];
        if (!file)
            return;

        try {
            const sha256 = await hashFile(file);
            const rom = {
                sha256,
                file,
                filename: file.name,
                size: file.size,
                added: Date.now()
            };

            await saveRom(rom);
            await cloud.addGame(
                sha256,
                file.name
            );

            addGameToList(rom);
        } catch(err) {
            console.error(err);
        } finally {
            uploadEl.value = "";
        }
    }
);

function addGameToList(game) {
    const li = document.createElement("li");
    li.dataset.sha256 = game.sha256;
    li.dataset.filename = game.filename;

    li.title = game.filename;

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

function markRomInstalled(sha256) {
    const li =
        gameListEl.querySelector(
            `[data-sha256="${sha256}"]`
        );

    if (!li)
        return;
    li.classList.remove("missing");
}

gameListEl.addEventListener(
    "click",
    async e => {
        const li =
            e.target.closest("li");
        if (!li)
            return;

        selectedSha256 =
            li.dataset.sha256;

        gameListEl
            .querySelector(".selected")
            ?.classList.remove("selected");
        li.classList.add("selected");
        const rom =
            await loadRom(selectedSha256);

        if (!rom) {
            selectedRom = null;
            reuploadBtn.hidden = false;
            updateRunButton();
            return;
        }

        selectedRom = rom;
        reuploadBtn.hidden = true;
        showGameDetails(rom);
        updateRunButton();
    }
);

function showGameDetails(rom) {
    gameTitleText.textContent =
        rom.title ??
        rom.filename.replace(/\.[^.]+$/, "");

    gameTitleText.classList.remove("ital");
    gameHero.src =
        "/assets/img/avatarBlank.svg";

    runStatusText.textContent = "Play";
    runStatusIcon.textContent = "play_arrow";
}

function updateRunButton() {
    runBtn.disabled =
        !selectedRom ||
        emulatorRunning;
}

removeGameBtn.addEventListener(
    "click",
    async () => {
        if (!selectedSha256)
            return;
        if (!confirm(
            "Remove this game from your collection?"
        ))
            return;
        await cloud.removeGame(
            selectedSha256
        );

        await deleteRom(
            selectedSha256
        );

        gameListEl
            .querySelector(
                `[data-sha256="${selectedSha256}"]`
            )
            ?.remove();

        selectedRom = null;
        selectedSha256 = null;
        updateEmptyState();
        updateRunButton();
    }
);

reuploadBtn.addEventListener(
    "click",
    () => {
        if(selectedSha256)
            reuploadInput.click();
    }
);

reuploadInput.addEventListener(
    "change",
    async () => {
        const file =
            reuploadInput.files[0];
        if(!file)
            return;
        const sha256 =
            await hashFile(file);

        if(sha256 !== selectedSha256) {
            alert(
                "This ROM does not match the missing game."
            );
            reuploadInput.value = "";
            return;
        }

        await saveRom({
            sha256,
            file,
            filename:file.name,
            size:file.size,
            added:Date.now()
        });

        markRomInstalled(
            sha256
        );
        reuploadInput.value = "";
    }
);

async function loadCollection() {
    const games =
        await syncCollection();

    for(const game of games) {
        const local =
            await loadRom(game.sha256);
        addGameToList(
            local ??
            {
                sha256:game.sha256,
                filename:game.filename,
                missing:true
            }
        );
    }
}

loadCollection();

function updateEmptyState(){

    noneFound.hidden =
        gameListEl.children.length > 0;

}

async function hashFile(file){
    const buffer =
        await file.arrayBuffer();
    const hash =
        await crypto.subtle.digest(
            "SHA-256",
            buffer
        );
    return [...new Uint8Array(hash)]
        .map(
            b =>
            b.toString(16)
            .padStart(2,"0")
        )
        .join("");
}

runBtn.addEventListener("click", () => {
    if (!selectedRom)
        return;

    runGame(selectedRom);
});
