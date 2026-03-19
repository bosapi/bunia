// ─── Error / Redirect Helpers ────────────────────────────
// Throw these from load() functions; the server catches and handles them.

export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = "HttpError";
    }
}

export class Redirect {
    constructor(public status: number, public location: string) {}
}

/** Throw an HTTP error from a load() function. */
export function error(status: number, message: string): never {
    throw new HttpError(status, message);
}

/** Redirect the user from a load() function. */
export function redirect(status: number, location: string): never {
    throw new Redirect(status, location);
}
