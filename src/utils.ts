/**
 * Pause execution for a given amount of time on the main thread
 * @param ms
 */
export const wait = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

type TimeoutResponse<T> = {
  timedOut: boolean;
  output: T | null;
};

// biome-ignore format: off.
/**
 * Executes an asynchronous function with a specified timeout. This utility function
 * allows an async function to be called with a time limit, returning either its result
 * or indicating if the operation timed out.
 *
 * If the provided async function completes before the timeout, the returned promise
 * resolves to an object containing `timedOut: false` and `output` with the result of
 * the async function. If the operation times out, the promise resolves to an object
 * with `timedOut: true` and `output` as null.
 *
 * In case the async function throws an error before the timeout, the error is propagated
 * and should be handled by the caller. The function uses `Promise.race` to achieve the
 * timeout behavior, ensuring that either the result of the async function or a timeout
 * result is returned, whichever occurs first.
 *
 * Note: This function does not cancel the execution of the async function if it times out.
 * The async function continues running in the background until completion.
 *
 * @template T The type of the output produced by the async function.
 * @param {() => Promise<T>} asyncFn The asynchronous function to execute with a timeout.
 *           This function should return a promise that resolves to the desired output.
 * @param {number} timeoutMs The timeout duration in milliseconds. If the async function
 *           does not complete within this time, the operation is considered to have timed out.
 * @returns {Promise<TimeoutResponse<T>>} A promise that resolves to an object of type
 *           `TimeoutResponse<T>`, which includes a `timedOut` boolean indicating whether
 *           the operation timed out, and `output`, which is the result of the async function
 *           if it completed in time, or null if the operation timed out.
 *
 * @example
 * async function fetchData() {
 *   // Simulated fetch operation
 *   return "Data";
 * }
 *
 * async function exampleUsage() {
 *   try {
 *     const { timedOut, output } = await withTimeout(fetchData, 1000);
 *     if (timedOut) {
 *       console.log("The operation timed out.");
 *     } else {
 *       console.log("Fetched data:", output);
 *     }
 *   } catch (error) {
 *     console.error("Error during fetch:", error.message);
 *   }
 * }
 *
 * exampleUsage();
 */

export function withTimeout<T>(asyncFn: () => Promise<T>, timeoutMs: number): Promise<TimeoutResponse<T>> {
  return new Promise<TimeoutResponse<T>>((resolve, reject) => {
    let timeoutHandle: NodeJS.Timeout;

    // Create a promise that resolves with a timeout flag after the specified time
    const timeoutPromise = new Promise<TimeoutResponse<T>>((_, reject) =>
      timeoutHandle = setTimeout(() => reject(new Error("Operation timed out")), timeoutMs)
    );

    // Execute the async function
    const asyncPromise = asyncFn().then(
      output => ({ timedOut: false, output }), // If async function succeeds
    );

    // Race the async function against the timeout
    Promise.race([asyncPromise, timeoutPromise])
      .then(resolve) // If the async function wins the race, resolve with its output
      .catch(error => {
        // If the async function throws an error or the timeout is reached, reject the promise
        if (error.message === "Operation timed out") {
          resolve({ timedOut: true, output: null }); // Handle timeout specifically
        } else {
          reject(error); // Propagate errors from the async function
        }
      })
      .finally(() => clearTimeout(timeoutHandle)); // Cleanup timeout
  });
}
