export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  role: { id: string; roleName: string };
}

export interface Token {
  user: AuthUser;
  accessToken: string;
}

type Listener = () => void;

let _token: Token | null = null;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((cb) => cb());

export const tokenStore = {
  get: () => _token,

  set: (t: Token | null) => {
    _token = t;
    emit();
  },

  clear: () => {
    _token = null;
    emit();
  },

  // Signature matches useSyncExternalStore
  subscribe: (cb: Listener): (() => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};
