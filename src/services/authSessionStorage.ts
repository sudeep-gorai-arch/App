import * as SecureStore from 'expo-secure-store';

// Serialize credential writes so a late 401 cannot erase a newly saved login.
let credentialWrites: Promise<void> = Promise.resolve();
const invalidationListeners = new Set<() => void>();

const withCredentialLock = <T>(operation: () => Promise<T>): Promise<T> => {
  const result = credentialWrites.then(operation, operation);
  credentialWrites = result.then(() => undefined, () => undefined);
  return result;
};

export const subscribeToSessionInvalidation = (listener: () => void) => {
  invalidationListeners.add(listener);
  return () => {
    invalidationListeners.delete(listener);
  };
};

export const getStoredToken = async (): Promise<string | null> => {
  await credentialWrites;
  return SecureStore.getItemAsync('token');
};

export const getStoredSession = async () => {
  await credentialWrites;
  const [token, user] = await Promise.all([
    SecureStore.getItemAsync('token'),
    SecureStore.getItemAsync('user'),
  ]);
  return { token, user };
};

export const persistSession = (token: string, user: unknown) =>
  withCredentialLock(async () => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
  });

export const clearStoredSession = () =>
  withCredentialLock(async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
  });

export const invalidateSessionForToken = (rejectedToken: string) =>
  withCredentialLock(async (): Promise<boolean> => {
    const currentToken = await SecureStore.getItemAsync('token');
    if (!currentToken || currentToken !== rejectedToken) return false;

    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    invalidationListeners.forEach(listener => listener());
    return true;
  });

// Never allow a completed response from an old session to overwrite a newer user.
export const persistProfileForToken = (
  expectedToken: string,
  profile: unknown,
  onCommit: () => void,
) =>
  withCredentialLock(async (): Promise<boolean> => {
    if ((await SecureStore.getItemAsync('token')) !== expectedToken) {
      return false;
    }
    await SecureStore.setItemAsync('user', JSON.stringify(profile));
    onCommit();
    return true;
  });
