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