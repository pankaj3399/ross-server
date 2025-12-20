const WORKER_URL = process.env.EVALUATION_WORKER_URL || "http://localhost:4003";

export function wakeWorker(): void {
    fetch(`${WORKER_URL}/wake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    })
        .then(() => {
            console.log("Worker woken up");
        })
        .catch((error) => {
            if (process.env.NODE_ENV === "development") {
                console.debug("Failed to wake worker (this is non-critical):", error.message);
            }
        });
}

