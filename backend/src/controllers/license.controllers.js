import { License } from "../models/license.models.js";
import { Department } from "../models/department.models.js";
import { User } from "../models/user.models.js";
import { sendEmail } from "../utils/emailService.js";
import connectDB from "../db/index.js";

// Helper function to format date/time
const giveTime = () => {
    const currentTime = new Date();
    const day = String(currentTime.getDate()).padStart(2, '0');
    const month = String(currentTime.getMonth() + 1).padStart(2, '0');
    const year = currentTime.getFullYear();
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

// Upload license with file stored directly in MongoDB
const uploadLicense = async (req, res) => {
    const { expiry_date, department_id } = req.body;

    if (!req.body.file || !expiry_date || !department_id) {
        return res.status(400).json({ success: false, message: "File, expiry date and department are required" });
    }

    try {
        // Get file data from request body
        const fileData = req.body.file;
        const fileBuffer = Buffer.from(fileData.data, 'base64');
        const fileType = fileData.type;
        const fileName = fileData.name;

        // Validate file type (only PDF or PNG)
        if (!fileType.match(/^(application\/pdf|image\/png)$/)) {
            return res.status(400).json({ success: false, message: "Only PDF and PNG files are allowed" });
        }

        // Verify department exists
        const departmentExists = await Department.findById(department_id);
        if (!departmentExists) {
            return res.status(400).json({ success: false, message: "Invalid department" });
        }

        // Create license document
        const license = await License.create({
            fileName,
            fileData: fileBuffer,
            fileType,
            expiryDate: new Date(expiry_date),
            department: department_id,
            uploadedBy: req.user._id
        });

        return res.status(201).json({
            success: true,
            message: "License uploaded successfully",
            data: license
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Get all licenses
const getAllLicenses = async (req, res) => {
    try {
        const licenses = await License.find()
            .select('-fileData')
            .populate('uploadedBy', 'fullName email')
            .sort({ expiryDate: 1 })
            .lean();

        // Format expiry dates and map IDs for frontend
        const formattedLicenses = licenses.map(license => ({
            ...license,
            id: license._id,
            file_name: license.fileName,
            department_id: license.department,
            expiry_date: new Date(license.expiryDate).toISOString().split('T')[0]
        }));

        return res.status(200).json({
            success: true,
            message: "Licenses retrieved successfully",
            data: formattedLicenses
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Get expiring licenses (expiring in next 15 days and already expired)
const getExpiringLicenses = async (req, res) => {
    try {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 15);

        const licenses = await License.find({
            expiryDate: { $lte: futureDate } // Removed $gte: today to include expired licenses
        })
            .select('-fileData')
            .populate('uploadedBy', 'fullName email')
            .sort({ expiryDate: 1 })
            .lean();

        // Format for frontend compatibility
        const formattedLicenses = licenses.map(license => ({
            ...license,
            id: license._id,
            file_name: license.fileName,
            department_id: license.department,
            expiry_date: new Date(license.expiryDate).toISOString().split('T')[0],
            daysUntilExpiry: Math.ceil((new Date(license.expiryDate) - today) / (1000 * 60 * 60 * 24))
        }));

        return res.status(200).json({
            success: true,
            message: "Expiring and expired licenses retrieved successfully",
            data: formattedLicenses
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Get licenses by department
const getLicensesByDepartment = async (req, res) => {
    try {
        const department = req.user.department;

        const licenses = await License.find({ department })
            .select('-fileData')
            .populate('uploadedBy', 'fullName email')
            .sort({ expiryDate: 1 })
            .lean();

        const formattedLicenses = licenses.map(license => ({
            ...license,
            id: license._id,
            file_name: license.fileName,
            department_id: license.department,
            expiry_date: new Date(license.expiryDate).toISOString().split('T')[0]
        }));

        return res.status(200).json({
            success: true,
            message: "Department licenses retrieved successfully",
            data: formattedLicenses
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Get license file by ID
const getLicenseFile = async (req, res) => {
    const { id } = req.params;

    try {
        const license = await License.findById(id).select('fileData fileType fileName');

        if (!license) {
            return res.status(404).json({ success: false, message: "License not found" });
        }

        res.setHeader('Content-Type', license.fileType);
        res.setHeader('Content-Disposition', `inline; filename="${license.fileName}"`);
        res.setHeader('Content-Length', license.fileData.length);

        return res.send(license.fileData);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Download license file
const downloadLicenseFile = async (req, res) => {
    const { id } = req.params;

    try {
        const license = await License.findById(id).select('fileData fileType fileName');

        if (!license) {
            return res.status(404).json({ success: false, message: "License not found" });
        }

        res.setHeader('Content-Type', license.fileType);
        res.setHeader('Content-Disposition', `attachment; filename="${license.fileName}"`);
        res.setHeader('Content-Length', license.fileData.length);

        return res.send(license.fileData);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Update license
const updateLicense = async (req, res) => {
    const { id } = req.params;
    const { expiry_date, department_id, file } = req.body;

    try {
        const license = await License.findById(id);
        if (!license) {
            return res.status(404).json({ success: false, message: "License not found" });
        }

        const updateData = {};
        if (expiry_date) updateData.expiryDate = new Date(expiry_date);
        if (department_id) {
            const dept = await Department.findById(department_id);
            if (!dept) return res.status(400).json({ success: false, message: "Invalid department" });
            updateData.department = department_id;
        }

        if (file) {
            if (!file.type.match(/^(application\/pdf|image\/png)$/)) {
                return res.status(400).json({ success: false, message: "Only PDF and PNG files are allowed" });
            }
            updateData.fileData = Buffer.from(file.data, 'base64');
            updateData.fileName = file.name;
            updateData.fileType = file.type;
        }

        const updatedLicense = await License.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).select('-fileData');

        return res.status(200).json({
            success: true,
            message: "License updated successfully",
            data: updatedLicense
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Delete license
const deleteLicense = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ success: false, message: "License ID is required" });
    }

    try {
        const license = await License.findById(id);

        if (!license) {
            return res.status(404).json({ success: false, message: "License not found" });
        }

        await License.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "License deleted successfully",
            license: { id, fileName: license.fileName }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Get license statistics
const getLicenseStats = async (req, res) => {
    try {
        await connectDB;

        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 15);

        const totalLicenses = await License.countDocuments();
        const expiringLicenses = await License.countDocuments({
            expiryDate: { $lte: futureDate, $gte: today }
        });
        const expiredLicenses = await License.countDocuments({
            expiryDate: { $lt: today }
        });
        const departmentStats = await License.aggregate([
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 },
                    expiring: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $lte: ['$expiryDate', futureDate] },
                                        { $gte: ['$expiryDate', today] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);

        return res.status(200).json({
            success: true,
            message: "License statistics retrieved successfully",
            stats: {
                totalLicenses,
                expiringLicenses,
                expiredLicenses,
                departmentStats
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Check for expiring licenses and send emails (to be called by cron job)
const checkAndNotifyExpiringLicenses = async () => {
    try {
        await connectDB;

        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 15);

        // Fetch all licenses expiring in 15 days that haven't been notified
        const licenses = await License.find({
            expiryDate: { $lte: futureDate, $gte: today },
            notificationSent: false
        }).lean();

        if (licenses.length === 0) {
            console.log('No licenses expiring soon or all notifications already sent.');
            return;
        }

        // Group licenses by department
        const departmentLicenses = {};
        licenses.forEach(license => {
            if (!departmentLicenses[license.department]) {
                departmentLicenses[license.department] = [];
            }
            departmentLicenses[license.department].push(license);
        });

        // Send one email per department
        for (const [department, deptLicenses] of Object.entries(departmentLicenses)) {
            // Get all users in the department
            const employees = await User.find({ department }).select('email fullName');

            if (employees.length === 0) {
                console.log(`No employees found in ${department} department`);
                continue;
            }

            // Create email body with all expiring licenses
            const licenseList = deptLicenses.map(license => {
                const expiryDate = new Date(license.expiryDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                const daysLeft = Math.ceil((new Date(license.expiryDate) - today) / (1000 * 60 * 60 * 24));
                return `- ${license.fileName} (Expiry Date: ${expiryDate} - ${daysLeft} days left)`;
            }).join("\n");

            const emailText = `Dear ${department} Team,\n\nThe following licenses in your department are expiring soon:\n\n${licenseList}\n\nPlease take necessary action to renew these licenses.\n\nBest Regards,\nIssue Tracker System - License Management`;

            // Send email to all department employees
            for (const employee of employees) {
                try {
                    await sendEmail(
                        employee.email,
                        `License Expiry Reminder - ${department} Department`,
                        emailText
                    );
                    console.log(`Email sent to ${employee.fullName} (${employee.email})`);
                } catch (emailError) {
                    console.error(`Failed to send email to ${employee.email}:`, emailError.message);
                }
            }

            // Mark licenses as notified
            const licenseIds = deptLicenses.map(l => l._id);
            await License.updateMany(
                { _id: { $in: licenseIds } },
                { $set: { notificationSent: true } }
            );

            console.log(`Notification sent for ${department} Department`);
        }

        return { success: true, message: 'Notifications sent successfully' };
    } catch (error) {
        console.error('Error sending license expiry emails:', error);
        throw error;
    }
};

// Manual trigger for checking expiring licenses (admin endpoint)
const triggerExpiryCheck = async (req, res) => {
    try {
        await checkAndNotifyExpiringLicenses();

        return res.status(200).json({
            success: true,
            message: "Expiry check completed and notifications sent"
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

export {
    uploadLicense,
    getAllLicenses,
    getExpiringLicenses,
    getLicensesByDepartment,
    getLicenseFile,
    downloadLicenseFile,
    updateLicense,
    deleteLicense,
    getLicenseStats,
    checkAndNotifyExpiringLicenses,
    triggerExpiryCheck
};
