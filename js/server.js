import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const projectURL = "https://uheoensvodegstcnunay.supabase.co";
const publishableKey = "sb_publishable_J9Mcy6wfFlE1OO4euTnVJg_Ncnrh35r";

export const supabase = createClient(projectURL, publishableKey);

//ui__signup
const signupEmail = document.getElementById("signupEmail");//input:text
const signupPassword = document.getElementById("signupPassword");//input:password
const signupUsername = document.getElementById("signupUsername");//input:text
const signupSubmit = document.getElementById("signupSubmit");//button

// signup
async function signUpNewUser(email, password, username, displayName) {
    if (!email) return; if (!password) return; if (!username) return;
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            emailRedirectTo: `${window.location.origin}/collection`,
            data: {
                username: username,
                display_name: displayName || username
            }
        },
    });
    if (error) { console.error(`ERROR: ${error.message}`); return }
    console.log(data);
    console.dir(data);

    if (error) {
        console.dir(error);
        return;
    }
}

if (signupSubmit) {
    signupSubmit.addEventListener("click", (e)=> {
        e.preventDefault();
        signUpNewUser(signupEmail.value.trim(), signupPassword.value.trim(), signupUsername.value.trim());
    });
}

//ui__login
const loginGithub = document.getElementById("loginGithub"); //button
const loginDiscord = document.getElementById("loginDiscord");//button
const loginGoogle = document.getElementById("loginGoogle");//button
const loginEmail = document.getElementById("loginEmail");//input:text
const loginPassword = document.getElementById("loginPassword");//input:password
const loginSubmit = document.getElementById("loginSubmit");//button:submit
const loginError = document.getElementById("loginError");//p#loginError

//signin
async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    if (error) return;
    try {
        loginError.textContent = `ERROR: ${error.message}`;
    } catch(err) {
        console.warn(err)
    }
    window.location.href = "/collection";
}

if (loginSubmit) {
    loginSubmit.addEventListener("click", (e)=> {
        e.preventDefault();
        if (!loginEmail.value.trim()) {
            loginError.textContent = "ERROR: Missing Email.";
            return;
        } else if (!loginPassword.value.trim()) {
            loginError.textContent = "ERROR: Missing Password";
            return;
        }
        signInWithEmail(loginEmail.value.trim(), loginPassword.value.trim());
    });
}

if (loginGithub) {
    loginGithub.addEventListener("click", async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/collection`
            }
        });
    });
}

let loggedUser = null;
let userMetadata = null;
const outOpt = document.querySelectorAll(".gbtn");
const inOpt = document.querySelectorAll(".lbtn");
outOpt.forEach(e => {
    e.hidden = true;
});
const { data: { user }, error } = await supabase.auth.getUser();
if (user) {
    loggedUser = user;
    userMetadata = loggedUser["user_metadata"];
    if (["/auth/login", "/auth/login.html", "/auth/signup", "/auth/signup.html"].includes(window.location.pathname)) {
        window.location.href = "/collection"
    }
    outOpt.forEach(e => {
        e.hidden = false;
    });
    inOpt.forEach(e => {
        e.hidden = true;
    });
} else {
    if (document.body.classList.contains("private")) {
        window.location.href = `${window.location.origin}/auth/login`;
    }
}
if (document.getElementById("gameList")) {
    noneFound.hidden = gameList.children.length > 0;
}

if (document.getElementById("avatar")) {
    document.getElementById("avatar").src = userMetadata.avatar_url || userMetadata.picture || "/assets/img/avatarBlank.svg";
}

if (loginDiscord) {
    loginDiscord.addEventListener("click", ()=> { alert("Logging in with Discord is currently not available. Please try again later.")});
}
if (loginGoogle) {
    loginGoogle.addEventListener("click", ()=> { alert("Logging in with Google is currently not available. Please try again later.")});
}
if (document.getElementById("displayName")) {
    document.getElementById("displayName").textContent = userMetadata.display_name || userMetadata.name;
}

const signoutButton = document.getElementById("signout");
if (signoutButton) {
    signoutButton.addEventListener("click", async ()=> {
        const { data, error } = await supabase.auth.signOut();
        if (!error) window.location.href = "/auth/login";
    });
}
