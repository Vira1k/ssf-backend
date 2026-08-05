const prisma = require("../config/prisma");

// =======================================
// Get All Camps
// =======================================
exports.getAllCamps = async (req, res) => {
    try {
        const camps = await prisma.camp.findMany({
            where: {
                isActive: true
            },
            orderBy: {
                name: "asc"
            }
        });

        return res.status(200).json({
            success: true,
            data: camps
        });

    } catch (error) {
        console.error("Get Camps Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch camps."
        });
    }
};

// =======================================
// Create Camp
// =======================================
exports.createCamp = async (req, res) => {
    try {

        const { name, address } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Camp name is required."
            });
        }

        const existingCamp = await prisma.camp.findUnique({
            where: {
                name: name.trim()
            }
        });

        if (existingCamp) {
            return res.status(400).json({
                success: false,
                message: "Camp already exists."
            });
        }

        const camp = await prisma.camp.create({
            data: {
                name: name.trim(),
                address
            }
        });

        return res.status(201).json({
            success: true,
            message: "Camp created successfully.",
            data: camp
        });

    } catch (error) {
        console.error("Create Camp Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create camp."
        });
    }
};

// =======================================
// Update Camp
// =======================================
exports.updateCamp = async (req, res) => {
    try {

        const id = Number(req.params.id);
        const { name, address, isActive } = req.body;

        const camp = await prisma.camp.findUnique({
            where: {
                id
            }
        });

        if (!camp) {
            return res.status(404).json({
                success: false,
                message: "Camp not found."
            });
        }

        const updatedCamp = await prisma.camp.update({
            where: {
                id
            },
            data: {
                name: name.trim(),
                address,
                isActive
            }
        });

        return res.status(200).json({
            success: true,
            message: "Camp updated successfully.",
            data: updatedCamp
        });

    } catch (error) {
        console.error("Update Camp Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update camp."
        });
    }
};

// =======================================
// Delete Camp
// =======================================
exports.deleteCamp = async (req, res) => {
    try {

        const id = Number(req.params.id);

        const camp = await prisma.camp.findUnique({
            where: {
                id
            }
        });

        if (!camp) {
            return res.status(404).json({
                success: false,
                message: "Camp not found."
            });
        }

        await prisma.camp.delete({
            where: {
                id
            }
        });

        return res.status(200).json({
            success: true,
            message: "Camp deleted successfully."
        });

    } catch (error) {
        console.error("Delete Camp Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete camp."
        });
    }
};