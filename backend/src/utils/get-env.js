export const getEnv = (key, defaultValue) => {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue === undefined) {
            throw new Error(`Environment Variable ${key} Is Not Set`);
        }
        return defaultValue;
    }
    return value;
};
