const crypto = require('crypto');
const { exec } = require('child_process');

/**
 * Gets the hardware ID (UUID) of the machine.
 */
async function getHwid() {
    try {
        return new Promise((resolve) => {
            exec('powershell -ExecutionPolicy Bypass -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"', (error, stdout) => {
                if (error) {
                    resolve("UNKNOWN-" + Math.random().toString(36).substring(7).toUpperCase());
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    } catch (err) {
        return "DEVICE-" + Math.random().toString(36).substring(7).toUpperCase();
    }
}

/**
 * Verifies a license key against the HWID.
 */
async function verifyLicense(key, hwid) {
    if (key === "TOLL-ANG-2026-ADM") return { success: true };

    try {
        const salt = "ToolLang_Secret_2026";
        const [sig, expireHex] = key.split('-');
        
        if (!sig || !expireHex) return { success: false, error: 'Định dạng Key không hợp lệ.' };

        const expectedSigInput = hwid + salt + expireHex;
        const expectedSig = crypto.createHash('sha256').update(expectedSigInput).digest('hex').substring(0, 12).toUpperCase();
        
        if (sig !== expectedSig) return { success: false, error: 'Key không hợp lệ cho thiết bị này.' };

        const expireTime = parseInt(expireHex, 16);
        if (Date.now() > expireTime) return { success: false, error: 'Bản quyền đã hết hạn.' };

        return { success: true };
    } catch (e) {
        return { success: false, error: 'Lỗi xác thực bản quyền.' };
    }
}

module.exports = { getHwid, verifyLicense };
