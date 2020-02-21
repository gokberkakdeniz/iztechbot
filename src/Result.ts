export type Result<T, E> = Ok<T, E> | Err<T, E>

export class Ok<T, E> {
    private _isError: boolean;
    private _isOk: boolean;
    private value: T;

    constructor(val: T) {
        this._isOk = true;
        this._isError = false;
        this.value = val;
    }

    unwrap() : T {
        return this.value;
    }

    unwrapOr(val: T) : T {
        return this.unwrap();
    }

    unwrapOrElse(cb : (val: T | E) => T) : T {
        return this.unwrap();
    }

    unwrapErr() : E {
        throw new Error(toString(this.value));
    }

    or(r: Result<T, any>) : Result<T, any> {
        return this;
    }

    orElse(cb: (val: T | E) => Result<T, E>) : Result<T, E> {
        return this;
    }

    expect(message: string) : T {
        return this.value;
    }

    expectErr(message: string) {
        throw new Error(`${message}: ${toString(this.value)}`);
    }

    isOk() {
        return this._isOk;
    }

    isErr() {
        return this._isError;
    }
}

export class Err<T, E> {
    private _isError: boolean;
    private _isOk: boolean;
    private value: E;
    
    constructor(val: E) {
        this._isError = true;
        this._isOk = false;
        this.value = val;
    }

    unwrap() : T {
        throw new Error(toString(this.value));
    }

    unwrapOr(val) {
        return val;
    }

    unwrapErr() {
        return this.value;
    }

    unwrapOrElse(cb : (val: T | E) => T) : T {
        return cb(this.value)
    }

    or(r: Result<T, any>) : Result<T, any> {
        return r;
    }

    orElse(cb: (val: T | E) => Result<T, E>) : Result<T, E> {
        return cb(this.value);
    }

    expect(message: string) : T {
        throw new Error(`${message}: ${toString(this.value)}`);
    }

    expectErr(message: string) {
        return this.value;
    }

    isOk() {
        return this._isOk;
    }

    isErr() {
        return this._isError;
    }
}

function toString(val) {
    let v = val.toString();

    if (v === "[object Object]") {
        try {
            v = JSON.stringify(val);
        } catch(e) {};
    }

    return v;
}