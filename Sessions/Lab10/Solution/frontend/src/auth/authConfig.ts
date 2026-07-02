import type { Configuration } from '@azure/msal-browser';

// Same Entra ID app registration the API has trusted since Lab 7 — see
// `Lab9/api/appsettings.json`'s "AzureAd" section. One app registration,
// two roles: the API validates tokens against this Client ID, and the SPA
// (this app) signs users in and asks for a token *for* this Client ID.
//
// Before this works, the app registration needs a second redirect URI —
// http://localhost:5173, the Vite dev server — added under its existing
// "Single-page application" platform (it currently only has Swagger's
// redirect URI). See ../../INSTRUCTOR-SETUP.md, step 2.
const clientId = '5c2ab77a-5cfb-4b0e-aa3c-327f600296e6';

export const msalConfig: Configuration = {
  auth: {
    clientId,
    // "consumers" — personal Microsoft accounts only, same audience the API
    // was registered under. A work/school tenant would use its tenant id
    // here instead, or "organizations"/"common" for a broader audience.
    authority: 'https://login.microsoftonline.com/consumers',
    redirectUri: 'http://localhost:5173',
  },
  cache: {
    // sessionStorage (MSAL's default) would sign you out every time you
    // close the tab. localStorage survives a refresh and a "did I leave
    // this open overnight" — fine for a teaching app, worth a second look
    // before using it in something that handles real user data.
    cacheLocation: 'localStorage',
  },
};

// The one scope this whole app ever asks for: the API's own
// `access_as_user` scope, exposed under its own Client ID (see
// `Program.cs`: `$"api://{clientId}/access_as_user"`). Asking for it here is
// what makes the access token MSAL hands back acceptable to the API's
// [Authorize] endpoints — a token with no scopes, or the wrong one, would
// still be a *valid* Microsoft token, just not one this API accepts.
export const loginRequest = {
  scopes: [`api://${clientId}/access_as_user`],
};
