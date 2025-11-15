class InMemoryQueue {
    private queue: Array<() => Promise<void>> = [];
    private isProcessing = false;

    async add(task: () => Promise<void>) {
        this.queue.push(task);
        await this.processQueue();
    }

    private async processQueue() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                try {
                    await task();
                } catch (error) {
                    console.error("Error processing task:", error);
                }
            }
        }
        this.isProcessing = false;
    }
}

export const queue = new InMemoryQueue();
