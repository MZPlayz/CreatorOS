import { AgenticReconciler } from "./AgenticReconciler.js";

type Job = {
  id: string;
  transactionId: string;
};

export class QueueProcessor {
  private queue: Job[] = [];
  private isProcessing = false;
  private concurrencyLimit = 2;
  private activeJobs = 0;

  add(job: Job) {
    this.queue.push(job);
    this.process();
  }

  private async process() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      if (this.activeJobs >= this.concurrencyLimit) {
        // Wait briefly if at concurrency limit
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      const job = this.queue.shift();
      if (!job) continue;

      this.activeJobs++;
      
      // Fire and forget execution, will decr activeJobs on finally
      this.executeJob(job).finally(() => {
        this.activeJobs--;
      });
    }

    this.isProcessing = false;
  }

  private async executeJob(job: Job) {
    try {
      const reconciler = new AgenticReconciler();
      await reconciler.processTransaction(job.transactionId);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
    }
  }
}

export const aiQueue = new QueueProcessor();
