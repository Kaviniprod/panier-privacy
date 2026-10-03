// The account-deletion page's logic, with no Firebase and no DOM in it, so a
// test can drive it with fakes. delete-account.js wires it to both.

/** Firebase's error codes, as one of the few answers the page can give. */
export function classify(error) {
  switch (error && error.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
    case "auth/user-cancelled":
      return "cancelled";
    case "auth/popup-blocked":
      return "blocked";
    case "auth/network-request-failed":
      return "network";
    default:
      return "failed";
  }
}

/**
 * Two steps, so nobody deletes an account by signing in: [signIn] proves whose
 * account it is and shows its address; [confirm] deletes it.
 *
 * `signIn()` resolves to `{ email }` or rejects; `deleteAccount()` and
 * `signOut()` resolve or reject. Every outcome is `{ ok: true, ... }` or
 * `{ ok: false, reason }`, `reason` being a [classify] answer.
 */
export function createDeletionFlow({ signIn, deleteAccount, signOut }) {
  let signedIn = false;
  return {
    async start() {
      try {
        const { email } = await signIn();
        signedIn = true;
        return { ok: true, email };
      } catch (error) {
        return { ok: false, reason: classify(error) };
      }
    },
    async confirm() {
      if (!signedIn) return { ok: false, reason: "failed" };
      try {
        await deleteAccount();
      } catch (error) {
        return { ok: false, reason: classify(error) };
      }
      signedIn = false;
      return { ok: true };
    },
    async cancel() {
      signedIn = false;
      try {
        await signOut();
      } catch (_) {
        // Nothing is kept in the browser; a failed sign-out leaves nothing behind.
      }
    },
  };
}
