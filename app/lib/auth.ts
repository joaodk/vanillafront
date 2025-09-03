import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from 'react';

export interface AuthData {
  hasLoaded: boolean;
  freeUser: string;
  fullAccess: string;
  premium: string;
  token: string;
  getToken: () => Promise<string | null>; // Add getToken to AuthData interface
}

export function useAuthData(): AuthData {
  const { has, getToken } = useAuth();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [freeUser, setFreeUser] = useState<string>('Unknown');
  const [fullAccess, setFullAccess] = useState<string>('Unknown');
  const [premium, setPremium] = useState<string>('');
  const [token, setToken] = useState<string>('Loading...');

  useEffect(() => {
    if (has) {
      setFreeUser(has({ plan: "free_user" }) ? 'true' : 'false');
      setFullAccess(has({ plan: "full_access" }) ? 'true' : 'false');
      setPremium(has({ feature: "premium" }) ? "true" : "false");
      setHasLoaded(true);
    }
  }, [has]);

  useEffect(() => {
    const fetchToken = async () => {
      if (getToken) {
        try {
          const currentToken = await getToken();
          setToken(currentToken || 'Not available');
//          console.log('Token set in useAuthData:', currentToken || 'Not available');
        } catch (error) {
          setToken('Error fetching token');
        }
      }
    };
    fetchToken();
  }, [getToken]);

  return {
    hasLoaded,
    freeUser,
    fullAccess,
    premium,
    token,
    getToken // Return getToken
  };
}
