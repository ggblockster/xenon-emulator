import {
    saveRom,
    loadRom,
    deleteRom
} from "./idb.js";

import { cloud, syncCollection } from "./cloud.js";
import {
    uploadTrigger, uploadEl, 
    gameListEl, noneFound, 
    gameTitleText, gameHero, runBtn, runStatusText,
    runStatusIcon, reuploadBtn, reuploadInput,
    removeGameBtn, recordHours, loadingBG,
    favouriteBtn, favStateIcon,
    consoleText
} from "./dom.js";

import { runGame, setEmulatorCloseCallback } from "./emulator.js";

import {
    getGameMetadata
} from "./metadata.js";

import {
    getPlatform,
    getConsoleSVG,
    consoleLookup
} from "./cores.js";

let selectedRom = null;
let selectedSha256 = null;
let emulatorRunning = false;
let collectionGames = {};
let selectedFavourite = false;

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
    li.dataset.title = game.title ?? "";
    li.dataset.banner = game.banner ?? "";
    li.dataset.logo = game.logo ?? "";
    li.classList.add("listROM");

    li.title = game.title ?? game.filename.replace(/\.[^.]+$/, "") ?? "(invalid ROM file)";

    if (game.missing)
        li.classList.add("missing");

    const img = document.createElement("img");
    img.src = "/assets/img/avatarBlank.svg";
    const text = document.createElement("span");
    text.textContent = game.title ?? game.filename.replace(/\.[^.]+$/, "");

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

function updateFavouriteButton() {
    favStateIcon.textContent =
        selectedFavourite
            ? "star"
            : "star_border";
    favStateIcon.title =
        selectedFavourite
                ? "Unfavourite Game"
                : "Favourite Game";
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
        const game = collectionGames[selectedSha256];

        const rom = await loadRom(selectedSha256);

        if (!rom) {
            selectedRom = null;
            selectedFavourite = game?.favourite ?? false;
            updateFavouriteButton();
            showGameDetails({
                sha256: selectedSha256,
                filename: li.dataset.filename,
                title: game?.title ?? li.dataset.title
            });

            reuploadBtn.hidden = false;
            updateRunButton();
            return;
        }

        const metadata =
            await getGameMetadata(
                rom.sha256,
                getPlatform(rom.filename)
            );

        selectedRom = {
            ...rom,
            ...metadata
        };

        selectedFavourite = game?.favourite ?? false;
        updateFavouriteButton();
        reuploadBtn.hidden = true;
        showGameDetails(selectedRom);
        updateRunButton();
    }
);

favouriteBtn.addEventListener(
    "click",
    async () => {

        if (!selectedSha256)
            return;

        selectedFavourite =
            !selectedFavourite;

        updateFavouriteButton();

        await cloud.favourite(
            selectedSha256,
            selectedFavourite
        );

        if (collectionGames[selectedSha256]) {
            collectionGames[selectedSha256].favourite =
                selectedFavourite;
        }
    }
);

function showGameDetails(rom) {
    gameTitleText.textContent =
        rom.title ||
        rom.filename.replace(/\.[^.]+$/, "");

    gameTitleText.classList.remove("ital");

    const svgRef = getPlatform(rom.filename);
    gameHero.style.backgroundImage = `url(${getConsoleSVG(svgRef)})`;
    try {
        consoleText.textContent = consoleLookup[getPlatform(rom.filename)];
    } catch {
        consoleText.textContent = "?????";
    }
    if (gameHero.style.backgroundImage == "url(/assets/img/controllers/bannerBlank.svg") {
        gameHero.style.backgroundSize = "88px";
    } else {
        gameHero.style.backgroundSize = "196px auto";
    }

    runStatusText.textContent = "Play";
    runStatusIcon.textContent = "play_arrow";
    const game = collectionGames[rom.sha256];
    const seconds = game?.playtime ?? 0;
    recordHours.textContent = (seconds / 3600).toFixed(1);
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
    loadingBG.classList.remove("hidden");
    try {
        const games =
            await syncCollection();
            collectionGames = {};
        for (const game of games) {
            collectionGames[game.sha256] = game;
            const local = await loadRom(game.sha256);
            const rom =
                local ??
                {
                    sha256: game.sha256,
                    filename: game.filename,
                    missing: true
                };
            const metadata =
                await getGameMetadata(
                    rom.sha256,
                    getPlatform(rom.filename)
                );
            addGameToList({
                ...rom,
                ...metadata
            });
        }
    } catch (err) {
        console.error(
            "Collection loading failed:",
            err
        );
    } finally {
        loadingBG.classList.add("hidden");
    }
}

loadCollection();

setEmulatorCloseCallback(
    (sha256, seconds) => {

        const game =
            collectionGames[sha256];

        if (!game)
            return;

        game.playtime =
            (game.playtime ?? 0)
            + seconds;

        if (selectedSha256 === sha256) {
            recordHours.textContent =
                (
                    game.playtime / 3600
                ).toFixed(1);
        }
    }
);

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
