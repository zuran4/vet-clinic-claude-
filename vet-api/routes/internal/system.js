import { Router } from "express";
import os from "node:os";
import checkDiskSpace from "check-disk-space";
import requireServiceKey from "../../middlewares/internal/requireServiceKey.js";

const router = Router();

function cpuSnapshot() {
  let idle = 0;
  let total = 0;
  for (const cpu of os.cpus()) {
    for (const t in cpu.times) total += cpu.times[t];
    idle += cpu.times.idle;
  }
  return { idle, total };
}

async function getCpuUsagePercent() {
  const start = cpuSnapshot();
  await new Promise((resolve) => setTimeout(resolve, 200));
  const end = cpuSnapshot();

  const idleDiff = end.idle - start.idle;
  const totalDiff = end.total - start.total;
  if (totalDiff <= 0) return 0;

  return Math.round((1 - idleDiff / totalDiff) * 1000) / 10;
}

// Ζωντανά στοιχεία του server που τρέχει το vet-api (CPU/RAM/δίσκος) —
// χρησιμοποιείται από το control plane για την κάρτα κατάστασης server.
router.get("/", requireServiceKey, async (req, res, next) => {
  try {
    const cpuUsagePercent = await getCpuUsagePercent();

    const totalMemMB = Math.round(os.totalmem() / (1024 * 1024));
    const freeMemMB = Math.round(os.freemem() / (1024 * 1024));
    const usedMemMB = totalMemMB - freeMemMB;

    const diskPath = os.platform() === "win32" ? "C:/" : "/";
    const disk = await checkDiskSpace(diskPath);
    const diskTotalGB = Math.round((disk.size / 1024 ** 3) * 10) / 10;
    const diskFreeGB = Math.round((disk.free / 1024 ** 3) * 10) / 10;
    const diskUsedGB = Math.round((diskTotalGB - diskFreeGB) * 10) / 10;

    res.json({
      cpu: { usagePercent: cpuUsagePercent, cores: os.cpus().length },
      memory: {
        totalMB: totalMemMB,
        usedMB: usedMemMB,
        freeMB: freeMemMB,
        usagePercent: Math.round((usedMemMB / totalMemMB) * 1000) / 10,
      },
      disk: {
        totalGB: diskTotalGB,
        usedGB: diskUsedGB,
        freeGB: diskFreeGB,
        usagePercent: diskTotalGB > 0 ? Math.round((diskUsedGB / diskTotalGB) * 1000) / 10 : 0,
      },
      uptimeSeconds: Math.round(os.uptime()),
      platform: os.platform(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
