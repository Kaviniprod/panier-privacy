// Wires the deletion page to Firebase Authentication, in the browser, with no
// server of ours. The page's text is in the HTML; this only shows and hides it.
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  GoogleAuthProvider,
  browserPopupRedirectResolver,
  deleteUser,
  initializeAuth,
  inMemoryPersistence,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { createDeletionFlow } from "./delete-flow.js";

// Public identifiers of the project's web app, not secrets: they name the
// project, and what they allow is decided by Firebase's authorized domains.
const firebaseConfig = {
  apiKey: "AIzaSyBIhJiEWS2FMn9xhEkQcbYjJL1iE_Womyo",
  authDomain: "panier-courses.firebaseapp.com",
  projectId: "panier-courses",
  appId: "1:658590551533:web:e9ae4c7ea22b9d40272be4",
};

const root = document.getElementById("delete-widget");
const $ = (id) => document.getElementById(id);
const show = (id, on) => ($(id).hidden = !on);

// Nothing about the session is kept in the browser: it lasts as long as the tab.
const auth = initializeAuth(initializeApp(firebaseConfig), {
  persistence: inMemoryPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

const flow = createDeletionFlow({
  signIn: async () => {
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
    return { email: user.email || "" };
  },
  deleteAccount: () => deleteUser(auth.currentUser),
  signOut: () => auth.signOut(),
});

function fail(reason) {
  const error = $("dw-error");
  error.textContent = root.dataset["msg" + reason[0].toUpperCase() + reason.slice(1)];
  error.hidden = false;
}

function reset() {
  $("dw-error").hidden = true;
  show("dw-confirm", false);
  show("dw-signin", true);
}

$("dw-signin").addEventListener("click", async () => {
  $("dw-error").hidden = true;
  $("dw-signin").disabled = true;
  const result = await flow.start();
  $("dw-signin").disabled = false;
  if (!result.ok) return fail(result.reason);
  $("dw-email").textContent = result.email;
  show("dw-signin", false);
  show("dw-confirm", true);
});

$("dw-cancel").addEventListener("click", async () => {
  await flow.cancel();
  reset();
});

$("dw-delete").addEventListener("click", async () => {
  $("dw-delete").disabled = true;
  const result = await flow.confirm();
  $("dw-delete").disabled = false;
  if (!result.ok) return fail(result.reason);
  show("dw-confirm", false);
  show("dw-done", true);
});

// Without this script the section stays hidden and the page offers the email.
root.hidden = false;
