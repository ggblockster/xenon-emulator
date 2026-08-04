const cores = {
    gb: "gb", // gameboy
    gbc: "gb", // gameboy colour
    gba: "gba", // gameboy advance
    nes: "nes", // nes
    fds: "nes",
    unf: "nes",
    unif: "nes",

    smc: "snes", //snes
    sfc: "snes",
    snes: "snes",
    fig: "snes",
    swc: "snes",
    bsx: "snes",

    n64: "n64", //n64
    z64: "n64",
    v64: "n64",

    nds: "nds", // ds/dsi

    // 3ds
    "3ds": "azahar",
    "3dsx": "azahar",
    cci: "azahar",
    cia: "azahar",
    cxi: "azahar",


    // sega
    sms: "sms", //master system
    gg: "gg",

    gen: "segaMD", //megadrive
    md: "segaMD",
    smd: "segaMD",

    "32x": "sega32x", //sega32x


    // NEC
    pce: "pce", //turbographx/pc-engine


    // Bandai
    ws: "ws",//wonderswan
    wsc: "wsc",//wonderswan colour


    // SNK
    ngp: "ngp",//neo geo pocket


    // Atari
    a26: "atari2600",
    a52: "atari5200",
    a78: "atari7800",

    atr: "atari800",
    atx: "atari800",
    cas: "atari800",
    xex: "atari800",

    lnx: "lynx",//atari lynx
    jag: "jaguar",//atari jaguar


    // Coleco
    col: "coleco",


    // MSX
    mx1: "msx",
    mx2: "msx2",


    // Atari ST
    st: "atarist",
    msa: "atarist",
    stx: "atarist",
    dim: "atarist",
    ipf: "atarist",


    // commodore 64
    d64: "c64",
    d71: "c64",
    d81: "c64",
    g64: "c64",
    t64: "c64",
    tap: "c64",
    prg: "c64",
    p00: "c64",
    crt: "c64",


    // PC-98
    d88: "pc98",
    fdi: "pc98",
    fdd: "pc98",
    hdm: "pc98",
    hdf: "pc98",
    hdi: "pc98",
    xdf: "pc98",


    // PC-88
    n88: "pc88",
    t88: "pc88",


    // amiga
    adf: "amiga",
    adz: "amiga",
    dms: "amiga",


    // playStation
    ccd: "psx",
    cue: "psx",
    img: "psx",
    mds: "psx",
    pbp: "psx"
};

export function getCore(filename) {
    const ext =
        filename
            .split(".")
            .pop()
            .toLowerCase();
    return cores[ext] ?? null;
}

export function getPlatform(filename) {
    const ext =
        filename
            .split(".")
            .pop()
            .toLowerCase();

    switch(ext) {
        case "gb":
            return "gb";

        case "gbc":
            return "gbc";

        case "gba":
            return "gba";

        case "n64":
        case "z64":
        case "v64":
            return "n64";

        case "nds":
            return "nds";

        case "nes":
        case "fds":
        case "unf":
        case "unif":
            return "nes";

        case "gg":
            return "gg";

        case "gen":
        case "md":
        case "smd":
            return "segaMd";

        case "sms":
            return "sms";

        case "sfc":
        case "smc":
            return "snes";

        case "3ds":
        case "3dsx":
        case "cia":
        case "cci":
        case "cxi":
            return "3ds";

        default:
            return null;
    }
}

export function getConsoleSVG(platform) {
    if (!platform) return;
    switch (platform) {
        case "gb":
        case "gbc":
            return "/assets/img/controllers/gameboy.svg";
        case "gba":
            return "/assets/img/controllers/gba.svg";
        case "n64":
            return "/assets/img/controllers/n64.svg";
        case "nes":
            return "/assets/img/controllers/nes.svg";
        case "nds":
            return "/assets/img/controllers/nds.svg";
        case "gg":
            return "/assets/img/controllers/game gear.svg";
        case "segaMd":
            return "/assets/img/controllers/megadrive.svg";
        case "sms":
            return "/assets/img/controllers/master system.svg";
        case "snes":
            return "/assets/img/controllers/snes.svg";
        case "3ds":
            return "/assets/img/controllers/nds.svg";
        default:
            return "/assets/img/bannerBlank.svg";
    }
}

export const consoleLookup = {
    "gb": "Nintendo GameBoy (NGB)",
    "gbc": "Nintendo GameBoy Colour (GBC)",
    "gba": "Nintendo GameBoy Advance (GBA)",
    "n64": "Nintendo 64 (N64)",
    "nds": "Nintendo DS / DSi (NDS)",
    "nes": "Nintendo Entertainment System (NES)",
    "gg": "SEGA Game Gear",
    "segaMd": "SEGA MegaDrive / SEGA Genesis",
    "sms": "SEGA Master System",
    "snes": "Super Nintendo Entertainment System (SNES)",
    "3ds": "Nintendo 3DS (3DS)"
}
