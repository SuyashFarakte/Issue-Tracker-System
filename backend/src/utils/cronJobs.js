import cron from 'node-cron';
import { checkAndNotifyExpiringLicenses } from '../controllers/license.controllers.js';

// Schedule cron job to check expiring licenses daily at 12:00 AM
export const scheduleLicenseExpiryCheck = () => {
    // Run every day at 12:00 AM 
    cron.schedule('0 0 * * *', async () => {
        console.log('Running scheduled license expiry check...');
        try {
            await checkAndNotifyExpiringLicenses();
            console.log('License expiry check completed successfully');
        } catch (error) {
            console.error('Error in scheduled license expiry check:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" // Adjust timezone as needed
    });

    console.log('License expiry check cron job scheduled (12:00 AM daily)');
};

// Optional: Run every Monday at 9:00 AM
export const scheduleWeeklyLicenseCheck = () => {
    // Run every Monday at 9:00 AM (Changed from 0 0 to 0 9)
    cron.schedule('0 9 * * 1', async () => {
        console.log('Running weekly license expiry check...');
        try {
            await checkAndNotifyExpiringLicenses();
            console.log('Weekly license expiry check completed');
        } catch (error) {
            console.error('Error in weekly license expiry check:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    console.log('Weekly license expiry check scheduled (Every Monday at 9:00 AM)');
};
