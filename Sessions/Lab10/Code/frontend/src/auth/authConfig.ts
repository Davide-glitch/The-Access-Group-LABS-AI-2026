import type { Configuration } from '@azure/msal-browser';

const clientId = '642452f4-96d5-49e6-bc37-d949807fa47d';

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: 'https://login.microsoftonline.com/consumers',
    redirectUri: 'http://localhost:5173',
  },
  cache: {
    cacheLocation: 'localStorage',
  },
};

export const loginRequest = {
  scopes: [`api://${clientId}/access_as_user`],
};