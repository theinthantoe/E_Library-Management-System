import {AdminLog} from "../models/AdminLog";
import {ActionLog} from "../models/ActionLog";

export  const deleteOldLogs = async ()=>{
    const oneMonth = new Date();
    oneMonth.setDate(oneMonth.getDate() - 1);

    try {
        // Delete old action logs
        const actionLogsResult = await ActionLog.deleteMany({ logTime: { $lt: oneMonth} });
        console.log(`Deleted ${actionLogsResult.deletedCount || 0} old action logs.`);

        // Delete old admin logs
        const adminLogsResult = await AdminLog.deleteMany({ logTime: { $lt: oneMonth} });
        console.log(`Deleted ${adminLogsResult.deletedCount || 0} old admin logs.`);
    } catch (error) {
        console.error("Error deleting old logs:", error);
    }
}

