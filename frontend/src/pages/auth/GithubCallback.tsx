import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import { useAppDispatch } from "@/app/hook";
import { setCredentials } from "@/features/auth/authSlice";
import { AUTH_ROUTES, PROTECTED_ROUTES } from "@/routes/common/routePath";

export default function GithubCallback() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [params] = useSearchParams();
    const handled = useRef(false);

    useEffect(() => {
        if (handled.current) return;
        handled.current = true;

        const hash = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hash.get("token");
        const expiresAtRaw = hash.get("expiresAt");
        const userRaw = hash.get("user");

        if (params.get("error") || !accessToken || !userRaw) {
            toast.error("GitHub Authentication Failed");
            navigate(AUTH_ROUTES.SIGN_IN, { replace: true });
            return;
        }

        try {
            const asNumber = Number(expiresAtRaw);
            const expiresAt = Number.isNaN(asNumber) ? expiresAtRaw : asNumber;

            dispatch(
                setCredentials({
                    accessToken,
                    expiresAt,
                    user: JSON.parse(userRaw),
                }),
            );
        } catch (error) {
            console.error("GitHub callback error", error);
            toast.error("GitHub Authentication Failed");
            navigate(AUTH_ROUTES.SIGN_IN, { replace: true });
            return;
        }

        toast.success("Signed In With GitHub");
        navigate(PROTECTED_ROUTES.OVERVIEW, { replace: true });
    }, [params, navigate, dispatch]);

    return (
        <div className="flex h-screen items-center justify-center">
            <Loader className="h-6 w-6 animate-spin" />
        </div>
    );
}
