import { Ok, Err, Result} from './../src/Result'

describe("Ok", () => {
    const ok = new Ok<number, number>(1);

    test("'isOk' should return true", () => {
        expect(ok.isOk())
            .toBe(true);
    })

    test("'isErr' should return false", () => {
        expect(ok.isErr())
            .toBe(false);
    })

    test("'unwrap' should return its value", () => {
        expect(ok.unwrap())
            .toBe(1);
    })

    test("'unwrapOr' should return its value", () => {
        expect(ok.unwrapOr(2))
            .toBe(1);
    })

    test("'unwrapErr' should throw its value", () => {
        expect(ok.unwrapErr.bind(ok))
            .toThrowError(new Error("1"));
    })

    test("'unwrapOrElse' should return its value", () => {
        expect(ok.unwrapOrElse(val => val * 2))
            .toBe(1);
    })

    test("'orElse' should return itself", () => {
        expect(ok.orElse(x => new Ok<number, number>(2)))
            .toBe(ok);
    })
})

describe("Ok + Ok", () => {
    const ok = new Ok<number, number>(1);
    const ok2 = new Ok<number, number>(2);

    test("'or' should return first one (1)", () => {
        expect(ok.or(ok2))
            .toBe(ok);
    })

    test("'or' should return first one (2)", () => {
        expect(ok2.or(ok))
            .toBe(ok2);
    })
})

describe("Err", () => {
    const err = new Err<number, number>(1);

    test("'isOk' should return false", () => {
        expect(err.isOk())
            .toBe(false);
    })

    test("'isErr' should return true", () => {
        expect(err.isErr())
            .toBe(true);
    })

    test("'unwrap' should throw error", () => {
        expect(err.unwrap.bind(err))
            .toThrowError("1");
    })

    test("'unwrapOr' should return given value", () => {
        expect(err.unwrapOr(2))
            .toBe(2);
    })

    test("'unwrapErr' should return its value", () => {
        expect(err.unwrapErr())
            .toBe(1)
    })

    test("'unwrapOrElse' should return its value", () => {
        expect(err.unwrapOrElse(val => val * 2))
            .toBe(2);
    })

    test("'orElse' should return itself", () => {
        expect(err.orElse(x => new Ok<number, number>(2)))
            .toStrictEqual(new Ok<number, number>(2));
    })
})

describe("Err + Err", () => {
    const err = new Err<number, number>(1);
    const err2 = new Err<number, number>(2);

    test("'or' should return second one (1)", () => {
        expect(err.or(err2))
            .toBe(err2);
    })

    test("'or' should return second one (2)", () => {
        expect(err2.or(err))
            .toBe(err);
    })
})

describe("Ok + Err", () => {
    const ok = new Ok<number, number>(1);
    const err = new Err<number, number>(2);

    test("'or' should return first one", () => {
        expect(ok.or(err))
            .toBe(ok);
    })

})

describe("Err + Ok", () => {
    const ok = new Ok<number, number>(1);
    const err = new Err<number, number>(2);

    test("'or' should return second one", () => {
        expect(err.or(ok))
            .toBe(ok);
    })
})