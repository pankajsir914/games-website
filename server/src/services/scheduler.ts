import cron from 'node-cron';
import { cricketService } from './cricketService';

export class CricketScheduler {
  private static instance: CricketScheduler;
  private jobs: cron.ScheduledTask[] = [];

  private constructor() {}

  static getInstance(): CricketScheduler {
    if (!CricketScheduler.instance) {
      CricketScheduler.instance = new CricketScheduler();
    }
    return CricketScheduler.instance;
  }

  start(): void {
    console.log('🏏 Starting Cricket Data Scheduler...');

    // Refresh every 2 minutes
    const refreshJob = cron.schedule('*/2 * * * *', async () => {
      console.log('🔄 Auto-refreshing cricket data...');
      try {
        await cricketService.refreshAllData();
        console.log('✅ Cricket data refresh completed');
      } catch (error) {
        console.error('❌ Cricket data refresh failed:', error);
      }
    }, {
      scheduled: false,
      timezone: "UTC"
    });

    // Start the job
    refreshJob.start();
    this.jobs.push(refreshJob);

    // Initial data fetch
    this.performInitialFetch();

    console.log('✅ Cricket scheduler started successfully');
  }

  stop(): void {
    console.log('⏹️ Stopping Cricket Data Scheduler...');
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('✅ Cricket scheduler stopped');
  }

  private async performInitialFetch(): Promise<void> {
    console.log('🚀 Performing initial cricket data fetch...');
    try {
      await cricketService.refreshAllData();
      console.log('✅ Initial cricket data fetch completed');
    } catch (error) {
      console.error('❌ Initial cricket data fetch failed:', error);
    }
  }

  // Manual trigger for immediate refresh
  async triggerRefresh(): Promise<void> {
    console.log('🔄 Manual cricket data refresh triggered...');
    try {
      await cricketService.refreshAllData();
      console.log('✅ Manual refresh completed');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      throw error;
    }
  }

  getStatus(): { active: boolean; jobCount: number; nextRun: Date | null } {
    return {
      active: this.jobs.length > 0 && this.jobs[0].running,
      jobCount: this.jobs.length,
      nextRun: this.jobs[0] ? new Date(Date.now() + 2 * 60 * 1000) : null // Next run in 2 minutes
    };
  }
}

export const cricketScheduler = CricketScheduler.getInstance();