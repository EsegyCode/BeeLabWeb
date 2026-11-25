// src/types.ts
import type { Env, User } from './db/schema';
import type { SessionData } from './utils/session';

export interface AppVariables {
  session: SessionData | null;
  user: User | null;
  csrfToken: string;
}

export type HonoEnv = {
  Bindings: Env;
  Variables: AppVariables;
};
