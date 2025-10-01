import React, { useState } from 'react';
import './App.css';
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import '/node_modules/primeflex/primeflex.css'
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { httpClient } from './HttpClient';

import Keycloak from 'keycloak-js';

/*
  Init Options
*/
let initOptions = {
  url: 'https://keycloak.trade-service.cyou/',
  realm: 'tradeservices',
  clientId: 'trade.portal', // Keycloak Client ID
  // Uncomment and add your client secret if "Client authentication" is "On" in Keycloak
  // clientSecret: 'your-client-secret-here',
}

console.log('Keycloak Configuration:', initOptions);

let kc = new Keycloak(initOptions);

// Initialize Keycloak with async/await and try-catch
const initializeKeycloak = async () => {
  try {
    console.log('Starting Keycloak initialization...');
    console.log('Current URL:', window.location.href);
    console.log('Origin:', window.location.origin);
    
    // Check if we're in a callback (have authorization code in URL)
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const hasAuthCode = urlParams.has('code');
    const hasError = urlParams.has('error');
    
    if (hasError) {
      console.error('Authorization error:', urlParams.get('error'));
      console.error('Error description:', urlParams.get('error_description'));
      return;
    }
    
    const authenticated = await kc.init({
      onLoad: hasAuthCode ? 'check-sso' : 'login-required', // Use check-sso if we have a code
      checkLoginIframe: false, // Disable iframe check - can cause issues
      pkceMethod: 'S256',
      redirectUri: window.location.origin + '/', // Add explicit redirect URI
      enableLogging: true, // Enable logging for debugging
      flow: 'standard', // Use standard flow instead of implicit
      responseMode: 'fragment', // Use fragment response mode
      scope: 'openid profile email' // Explicitly set scope
    });

    if (!authenticated) {
      console.error("Authentication failed - not authenticated");
      window.location.reload();
      return;
    }

    /* Remove below logs if you are using this on production */
    console.info("Authenticated successfully");
    console.log('auth', authenticated);
    console.log('Keycloak', kc);
    console.log('Access Token', kc.token);
    console.log('Token expires in:', kc.tokenParsed?.exp ? new Date(kc.tokenParsed.exp * 1000) : 'Unknown');

    /* http client will use this header in every request it sends */
    httpClient.defaults.headers.common['Authorization'] = `Bearer ${kc.token}`;

    // Improved token expiration handling
    kc.onTokenExpired = async () => {
      console.log('Token expired, attempting to refresh...');
      try {
        const refreshed = await kc.updateToken(30);
        if (refreshed) {
          console.log('Token refreshed successfully');
          // Update the authorization header with the new token
          httpClient.defaults.headers.common['Authorization'] = `Bearer ${kc.token}`;
        } else {
          console.log('Token is still valid');
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        console.error('Refresh error type:', typeof error);
        // Force re-authentication
        kc.login();
      }
    };

    // Set up automatic token refresh before expiration
    const refreshToken = async () => {
      try {
        const refreshed = await kc.updateToken(30);
        if (refreshed) {
          console.log('Token refreshed proactively');
          httpClient.defaults.headers.common['Authorization'] = `Bearer ${kc.token}`;
        }
      } catch (error) {
        console.error('Proactive token refresh failed:', error);
        console.error('Proactive refresh error type:', typeof error);
      }
    };

    // Refresh token every 4 minutes (adjust based on your token lifetime)
    setInterval(refreshToken, 4 * 60 * 1000);

  } catch (error) {
    /* Enhanced error handling with comprehensive checks */
    console.error("Authentication Failed");
    // Don't try to reinitialize - Keycloak instance can only be initialized once
    console.error('Please check your Keycloak client configuration and try refreshing the page.');
  }
};

// Initialize Keycloak
initializeKeycloak();

function App() {

  const [infoMessage, setInfoMessage] = useState('');
  const [authStatus, setAuthStatus] = useState('Initializing...');
  const [lastError, setLastError] = useState('');

  /* To demonstrate : http client adds the access token to the Authorization header */
  const callBackend = () => {
    setInfoMessage('Making request...');
    httpClient.get('https://mockbin.com/request')
      .then((response) => {
        setInfoMessage('Request successful: ' + JSON.stringify(response.data, null, 2));
      })
      .catch((error) => {
        setInfoMessage('Request failed: ' + error.message);
        setLastError(error.response?.data || error.message);
      });
  };

  // Update auth status periodically
  React.useEffect(() => {
    const updateAuthStatus = () => {
      try {
        if (kc && kc.authenticated) {
          const tokenExp = kc.tokenParsed?.exp;
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = tokenExp ? tokenExp - now : 0;
          
          if (timeLeft > 0) {
            setAuthStatus(`Authenticated (Token expires in ${Math.floor(timeLeft / 60)} minutes)`);
          } else {
            setAuthStatus('Token expired');
          }
        } else {
          setAuthStatus('Not authenticated');
        }
      } catch (error) {
        console.error('Error updating auth status:', error);
        setAuthStatus('Error checking auth status');
      }
    };

    updateAuthStatus();
    const interval = setInterval(updateAuthStatus, 10000); // Update every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <div className='grid'>
        <div className='col-12'>
          <h1>My Secured React App</h1>
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
            <strong>Auth Status:</strong> {authStatus}
            {lastError && (
              <div style={{ marginTop: '10px', color: 'red' }}>
                <strong>Last Error:</strong> {lastError}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid">

      </div>

      <div className='grid'>
        <div className='col-1'></div>
        <div className='col-2'>
          <div className="col">
            <Button onClick={() => { setInfoMessage(kc.authenticated ? 'Authenticated: TRUE' : 'Authenticated: FALSE') }}
              className="m-1 custom-btn-style"
              label='Is Authenticated' />

            <Button onClick={() => { kc.login() }}
              className='m-1 custom-btn-style'
              label='Login'
              severity="success" />

            <Button onClick={() => { setInfoMessage(kc.token) }}
              className="m-1 custom-btn-style"
              label='Show Access Token'
              severity="info" />

            <Button onClick={() => { setInfoMessage(JSON.stringify(kc.tokenParsed)) }}
              className="m-1 custom-btn-style"
              label='Show Parsed Access token'
              severity="warning" />

            <Button onClick={() => { setInfoMessage(kc.isTokenExpired(5).toString()) }}
              className="m-1 custom-btn-style"
              label='Check Token expired'
              severity="info" />

            <Button onClick={() => { kc.updateToken(10).then((refreshed) => { setInfoMessage('Token Refreshed: ' + refreshed.toString()) }, (e) => { setInfoMessage('Refresh Error') }) }}
              className="m-1 custom-btn-style"
              label='Update Token (if about to expire)' />  {/** 10 seconds */}

            <Button onClick={callBackend}
              className='m-1 custom-btn-style'
              label='Send HTTP Request'
              severity="success" />

            <Button onClick={() => { kc.logout({ redirectUri: window.location.origin + '/' }) }}
              className="m-1 custom-btn-style"
              label='Logout'
              severity="danger" />

            <Button onClick={() => { setInfoMessage(kc.hasRealmRole('admin').toString()) }}
              className="m-1 custom-btn-style"
              label='has realm role "Admin"'
              severity="info" />

            <Button onClick={() => { setInfoMessage(kc.hasResourceRole('test').toString()) }}
              className="m-1 custom-btn-style"
              label='has client role "test"'
              severity="info" />

          </div>
        </div>
        <div className='col-6'>

          <Card>
            <p style={{ wordBreak: 'break-all' }} id='infoPanel'>
              {infoMessage}
            </p>
          </Card>
        </div>

        <div className='col-2'></div>
      </div>



    </div>
  );
}


export default App;
