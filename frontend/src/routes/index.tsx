import { useAuthExpiration } from "@/hooks/use-auth-expiration";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthRoute from "./authRoute";
import BaseLayout from "@/components/layouts/base-layout";
import { authenticationRoutePaths } from "./common/routes";
import GithubCallback from "@/pages/auth/GithubCallback";

function AppRoutes() {
    useAuthExpiration();
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/auth/github/callback"
                    element={<GithubCallback />}
                />
                <Route element={<AuthRoute />}>
                    <Route element={<BaseLayout />}>
                        {authenticationRoutePaths.map((route) => (
                            <Route
                                key={route.path}
                                path={route.path}
                                element={route.element}
                            />
                        ))}
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;
