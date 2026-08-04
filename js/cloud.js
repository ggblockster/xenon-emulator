import { supabase } from "./server.js";
import { loadAllRoms } from "./idb.js";


async function rpc(fn, args) {
    const {
        data: { session }
    } = await supabase.auth.getSession();

    if (!session)
        return;

    const { error } =
        await supabase.rpc(
            fn,
            args
        );

    if (error)
        console.error(
            `RPC ${fn} failed:`,
            error
        );
}

export const cloud = {
    addGame(sha256, filename) {
        return rpc(
            "add_game",
            {
                game_hash: sha256,
                filename
            }
        );
    },

    removeGame(sha256) {
        return rpc(
            "remove_game",
            {
                game_hash: sha256
            }
        );
    },

    addPlaytime(sha256, seconds) {
        return rpc(
            "add_playtime",
            {
                game_hash: sha256,
                seconds
            }
        );
    },

    favourite: async (sha256, value) => {
        return rpc("set_favourite", {
            game_hash: sha256,
            value
        });
    },

    savefile(sha256, path) {
        return rpc(
            "set_savefile",
            {
                game_hash: sha256,
                savefile_path: path
            }
        );
    }
};

export async function syncCollection() {

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user)
        return [];

    const {
        data: profile,
        error
    } =
        await supabase
            .from("profiles")
            .select("collection")
            .eq("uuid", user.id)
            .single();

    if (error) {
        console.error(
            "Profile sync failed:",
            error
        );

        return [];
    }

    const cloudGames =
        profile.collection?.games ?? {};

    const local =
        await loadAllRoms();

    // upload local games that are not in cloud
    for (const rom of local) {

        if (cloudGames[rom.sha256])
            continue;
        await cloud.addGame(
            rom.sha256,
            rom.filename
        );
        cloudGames[rom.sha256] = {
            filename: rom.filename,
            playtime: 0,
            savefile: "",
            favourite: false,
            last_played: null
        };
    }

    return Object.entries(cloudGames)
        .map(
            ([sha256, game]) => ({
                sha256,
                ...game
            })
        );
}
