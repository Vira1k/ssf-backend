const prisma = require("../config/prisma");

// =======================================
// Get All Groups
// =======================================
exports.getAllGroups = async (req, res) => {
    try {

        const campId = Number(req.query.campId);
      const groups = await prisma.group.findMany({
    where: campId
        ? {
            campId,
            isActive: true
        }
        : {
            isActive: true
        },            include: {
                camp: {
    select: {
        id: true,
        name: true
    }
},

                _count: {
    select: {
        students: {
            where: {
                isActive: true
            }
        }
    }
},

                schedules: {
                    include: {
                        volunteer: {
                            select: {
                                id: true,
                                fullName: true
                            }
                        }
                    }
                }
            },

            orderBy: [
                {
                    camp: {
                        name: "asc"
                    }
                },
                {
                    name: "asc"
                }
            ]
        });

        return res.status(200).json({
            success: true,
            data: groups
        });

    } catch (error) {

        console.error("Get Groups Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch groups."
        });

    }
};

// =======================================
// Get Students of a Group
// =======================================
exports.getGroupStudents = async (req, res) => {

    try {

        const groupId = Number(req.params.groupId);

        const group = await prisma.group.findUnique({
            where: {
                id: groupId
            },

            include: {
                students: {
                    where: {
                        isActive: true
                    },
                    orderBy: {
                        fullName: "asc"
                    }
                }
            }
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        return res.status(200).json({
            success: true,
            groupName: group.name,
            data: group.students
        });

    } catch (error) {

        console.error("Get Group Students Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};

// =======================================
// Create Group + Assign Volunteer
// =======================================
exports.createGroup = async (req, res) => {

    try {

        const {
    campId,
    name,
    description,
    isActive
} = req.body;

       if (!campId || !name) {
    return res.status(400).json({
        success: false,
        message: "Camp and Group Name are required."
    });
}
        // Check Camp
        const camp = await prisma.camp.findUnique({
            where: {
                id: Number(campId)
            }
        });

        if (!camp) {
            return res.status(404).json({
                success: false,
                message: "Camp not found."
            });
        }

        // Find Group
        let group = await prisma.group.findFirst({
            where: {
                campId: Number(campId),
                name: name.trim()
            }
        });

        // Create Group
        if (!group) {

           group = await prisma.group.create({
    data: {
        campId: Number(campId),
        name: name.trim(),
        description,
        isActive
    }
});

        }
 
       
        // Return Updated Group
        const result = await prisma.group.findUnique({

            where: {
                id: group.id
            },

            include: {

                camp: true,

                students: {
                    where: {
                        isActive: true
                    }
                },

                schedules: {
                    include: {
                        volunteer: {
                            select: {
                                id: true,
                                fullName: true
                            }
                        }
                    }
                }

            }

        });

        return res.status(201).json({

            success: true,
            message: "Group saved successfully.",
            data: result

        });

    } catch (error) {

        console.error("Create Group Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to save group."
        });

    }

};
// =======================================
// Update Group
// =======================================
exports.updateGroup = async (req, res) => {
    try {

        const id = Number(req.params.id);

        const {
            campId,
            name,
            description,
            isActive
        } = req.body;

        const existingGroup = await prisma.group.findUnique({
            where: {
                id
            }
        });

        if (!existingGroup) {
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        // Check Camp
        const camp = await prisma.camp.findUnique({
            where: {
                id: Number(campId)
            }
        });

        if (!camp) {
            return res.status(404).json({
                success: false,
                message: "Camp not found."
            });
        }

        // Prevent duplicate group name in same camp
        const duplicateGroup = await prisma.group.findFirst({
            where: {
                id: {
                    not: id
                },
                campId: Number(campId),
                name: name.trim()
            }
        });

        if (duplicateGroup) {
            return res.status(400).json({
                success: false,
                message: "Group already exists in this camp."
            });
        }

        const group = await prisma.group.update({
            where: {
                id
            },
            data: {
                campId: Number(campId),
                name: name.trim(),
                description,
                isActive
            }
        });

        return res.status(200).json({
            success: true,
            message: "Group updated successfully.",
            data: group
        });

    } catch (error) {

        console.error("Update Group Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update group."
        });

    }
};
// =======================================
// Delete Group
// =======================================
exports.deleteGroup = async (req, res) => {
    try {

        const id = Number(req.params.id);

        const existingGroup = await prisma.group.findUnique({
            where: {
                id
            }
        });

        if (!existingGroup) {
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        await prisma.group.delete({
            where: {
                id
            }
        });

        return res.status(200).json({
            success: true,
            message: "Group deleted successfully."
        });

    } catch (error) {

        console.error("Delete Group Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete group."
        });

    }
};
// =======================================
// Get Groups For Dropdown
// =======================================
exports.getGroupsDropdown = async (req, res) => {

    try {

        const groups = await prisma.group.findMany({

            where: {
                isActive: true
            },

            select: {
                id: true,
                name: true
            },

            orderBy: {
                name: "asc"
            }

        });

        return res.status(200).json({
            success: true,
            data: groups
        });

    } catch (error) {

        console.error("Get Groups Dropdown Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch groups."
        });

    }

};