const databases = {
    gb: "/assets/json/gb.json",
    gba: "/assets/json/gba.json",
    gbc: "/assets/json/gbc.json",
    n64: "/assets/json/n64.json",
    nds: "/assets/json/nds.json",
    nes: "/assets/json/nes.json",
    gg: "/assets/json/segagg.json",
    segaMd: "/assets/json/segamd.json",
    sms: "/assets/json/segams.json",
    snes: "/assets/json/snes.json"
};

const loadedDatabases = {};

async function loadDatabase(platform) {
    if (loadedDatabases[platform])
        return loadedDatabases[platform];

    const path = databases[platform];

    if (!path)
        return {};

    try {
        const response = await fetch(path);
        if (!response.ok)
            throw new Error(
                `Failed loading ${platform} database`
            );

        const json = await response.json();
        loadedDatabases[platform] = json;
        return json;

    } catch (err) {
        console.error(
            "Metadata load failed:",
            platform,
            err
        );

        loadedDatabases[platform] = {};
        return {};
    }
}


export async function getGameMetadata(
    sha256,
    platform
) {
    const database =
        await loadDatabase(platform);

    return database[sha256] ?? null;
}
