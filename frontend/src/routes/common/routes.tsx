import GithubCallback from "@/pages/auth/GithubCallback";
import { AUTH_ROUTES } from "./routePath";

import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";

export const authenticationRoutePaths = [
    { path: AUTH_ROUTES.SIGN_IN, element: <SignIn /> },
    { path: AUTH_ROUTES.SIGN_UP, element: <SignUp /> },
];
