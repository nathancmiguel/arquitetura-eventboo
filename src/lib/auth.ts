import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { opcoesAuth } from "./auth-config.ts";

export const auth = betterAuth({
	...opcoesAuth,
	// Precisa ser o último plugin: grava os cookies de sessão nas server functions.
	plugins: [tanstackStartCookies()],
});
