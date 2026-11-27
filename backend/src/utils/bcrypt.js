import bcrypt from "bcryptjs";

export const hashValue = (value, saltRounds = 10) =>
    bcrypt.hash(value, saltRounds);

export const compareValue = (value, hashedValue) =>
    bcrypt.compare(value, hashedValue);
