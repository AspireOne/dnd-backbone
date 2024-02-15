var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const wait = (ms) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => setTimeout(resolve, ms));
});
export function withTimeout(asyncFn, timeoutMs) {
    return new Promise((resolve, reject) => {
        let timeoutHandle;
        const timeoutPromise = new Promise((_, reject) => timeoutHandle = setTimeout(() => reject(new Error("Operation timed out")), timeoutMs));
        const asyncPromise = asyncFn().then(output => ({ timedOut: false, output }));
        Promise.race([asyncPromise, timeoutPromise])
            .then(resolve)
            .catch(error => {
            if (error.message === "Operation timed out") {
                resolve({ timedOut: true, output: null });
            }
            else {
                reject(error);
            }
        })
            .finally(() => clearTimeout(timeoutHandle));
    });
}
//# sourceMappingURL=utils.js.map