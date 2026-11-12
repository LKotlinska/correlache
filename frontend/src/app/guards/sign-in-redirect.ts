/**
 * Query param authGuard adds when it sends a signed-out user to the landing page.
 * The landing page opens the sign-in dialog when it sees it; guestGuard skips its session check.
 */
export const SIGN_IN_PARAM = 'signIn';
export const SIGN_IN_REQUIRED = 'required';

export const signInRequiredQuery = { [SIGN_IN_PARAM]: SIGN_IN_REQUIRED };
