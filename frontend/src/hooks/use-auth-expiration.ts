import { useAppDispatch, useTypedSelector } from "@/app/hook";
import { logout } from "@/features/auth/authSlice";
import { useEffect } from "react";

const EXPIRY_BUFFER = 2 * 60 * 1000;
const MAX_TIMEOUT = 2 ** 31 - 1;

export const useAuthExpiration = () => {
    const { accessToken, expiresAt } = useTypedSelector((state) => state.auth);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!accessToken || !expiresAt) return;

        const expiresAtMs = new Date(expiresAt).getTime();
        let timer: ReturnType<typeof setTimeout>;

        const check = () => {
            const remaining = expiresAtMs - Date.now() - EXPIRY_BUFFER;
            if (remaining <= 0) {
                dispatch(logout());
                return;
            }
            timer = setTimeout(check, Math.min(remaining, MAX_TIMEOUT));
        };

        check();
        return () => clearTimeout(timer);
    }, [accessToken, expiresAt, dispatch]);
};
