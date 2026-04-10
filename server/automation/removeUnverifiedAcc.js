import cron from "node-cron";   
import User from "../models/userModel.js";

// Schedule a cron job to run every hour
export const removeUnverifiedAccounts = cron.schedule('50 * * * *', async () => {
      const  fiftyMinutesAgo = new Date(Date.now() - 50 * 60 * 1000);
      await User.deleteMany({
        accountVerified: false,
        createdAt: { $lt: fiftyMinutesAgo }
      });
      
});

export default removeUnverifiedAccounts;