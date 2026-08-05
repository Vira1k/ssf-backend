const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {

    console.log("==================================");
    console.log("🌱 SSF Database Seeding Started...");
    console.log("==================================");

    const colleges = [
        "AKGEC",
        "KIET",
        "ABES",
        "GL Bajaj",
        "IMS",
        "IPEC",
        "RKGIT",
        "Galgotias",
        "NIET",
        "ITS"
    ];

    const firstNames = [
        "Aman","Rahul","Rohit","Vishal","Ankit","Saurabh","Deepak","Mohit",
        "Nitin","Harsh","Aditya","Arjun","Vivek","Shubham","Ayush","Yash",
        "Priya","Neha","Pooja","Komal","Riya","Sneha","Aarti","Muskan",
        "Sakshi","Kavita","Simran","Nidhi","Khushi","Anjali",
        "Payal","Akash","Abhishek","Manish","Sumit","Tarun",
        "Ravi","Karan","Shivam","Ritik","Prince","Anurag",
        "Divya","Megha","Pallavi","Isha","Jyoti","Monika",
        "Rashmi","Shreya","Vaishnavi","Yogesh","Lakshya","Bhavesh"
    ];

    const lastNames = [
        "Sharma",
        "Singh",
        "Verma",
        "Gupta",
        "Yadav",
        "Patel",
        "Maurya",
        "Jain",
        "Kumar",
        "Mishra"
    ];
        console.log("\n👨‍🏫 Creating Volunteers...\n");

    for (let i = 1; i <= 58; i++) {

        const first =
            firstNames[Math.floor(Math.random() * firstNames.length)];

        const last =
            lastNames[Math.floor(Math.random() * lastNames.length)];

        const fullName = `${first} ${last}`;

        const gender =
            Math.random() > 0.5 ? "MALE" : "FEMALE";

        const college =
            colleges[Math.floor(Math.random() * colleges.length)];

        const mobile =
            `98${String(76543210 + i).padStart(8, "0")}`;

        const email =
            `${first.toLowerCase()}${i}@gmail.com`;

        const existing = await prisma.user.findFirst({

            where: {

                OR: [

                    { mobile },

                    { email }

                ]

            }

        });

        if (existing) {

            console.log(`⚠ Skipped ${mobile}`);

            continue;

        }

        await prisma.user.create({

            data: {

                fullName,

                mobile,

                email,

                college,

                gender,

                password: "123456",

                role: "VOLUNTEER",

                status: "APPROVED",

                isActive: true

            }

        });

        console.log(`✅ Volunteer ${i} Created`);

    }

    console.log("\n🎉 58 Volunteers Ready!");
        console.log("\n📚 Creating Groups...\n");

    const groups = [

        {
            name: "Group A",
            description: "Nursery",
            teachingDay: "Sunday"
        },

        {
            name: "Group B",
            description: "Class 1",
            teachingDay: "Monday"
        },

        {
            name: "Group C",
            description: "Class 2",
            teachingDay: "Tuesday"
        },

        {
            name: "Group D",
            description: "Class 3",
            teachingDay: "Wednesday"
        },

        {
            name: "Group E",
            description: "Class 4",
            teachingDay: "Thursday"
        },

        {
            name: "Group F",
            description: "Class 5",
            teachingDay: "Friday"
        },

        {
            name: "Group G",
            description: "Class 6",
            teachingDay: "Saturday"
        },

        {
            name: "Group H",
            description: "Class 7",
            teachingDay: "Sunday"
        },

        {
            name: "Group I",
            description: "Class 8",
            teachingDay: "Monday"
        },

        {
            name: "Group J",
            description: "Class 9",
            teachingDay: "Tuesday"
        }

    ];

    for (const group of groups) {

        const exists = await prisma.group.findUnique({

            where: {

                name: group.name

            }

        });

        if (exists) {

            console.log(`⚠ ${group.name} already exists`);

            continue;

        }

        await prisma.group.create({

            data: {

                name: group.name,

                description: group.description,

                teachingDay: group.teachingDay,

                isActive: true

            }

        });

        console.log(`✅ ${group.name} Created`);

    }

    console.log("\n🎉 All Groups Created!");
        console.log("\n📅 Creating Volunteer Schedules...\n");

    const allGroups = await prisma.group.findMany({
        orderBy: {
            id: "asc"
        }
    });

    const volunteers = await prisma.user.findMany({
        where: {
            role: "VOLUNTEER"
        },
        orderBy: {
            id: "asc"
        }
    });

    const subjects = [
        "ENGLISH",
        "HINDI",
        "MATHS",
        "SCIENCE",
        "GK",
        "COMPUTER",
        "ART",
        "ACTIVITY",
        "MORAL_EDUCATION"
    ];

    const timings = [
        "4:00 PM",
        "4:30 PM",
        "5:00 PM",
        "5:30 PM"
    ];

    for (let i = 0; i < volunteers.length; i++) {

        const volunteer = volunteers[i];

        const group = allGroups[i % allGroups.length];

        // Assign volunteer to group (one volunteer per group in current schema)

        if (i < allGroups.length) {

            await prisma.group.update({

                where: {
                    id: group.id
                },

                data: {
                    volunteerId: volunteer.id
                }

            });

        }

        const exists = await prisma.schedule.findFirst({

            where: {

                volunteerId: volunteer.id,

                groupId: group.id

            }

        });

        if (exists) {

            console.log(`⚠ Schedule exists for ${volunteer.fullName}`);

            continue;

        }

        await prisma.schedule.create({

            data: {

                volunteerId: volunteer.id,

                groupId: group.id,

                subject:
                    subjects[Math.floor(Math.random() * subjects.length)],

                teachingDay: group.teachingDay,

                teachingTime:
                    timings[Math.floor(Math.random() * timings.length)],

                status: "ACTIVE",

                isHoliday: false

            }

        });

        console.log(
            `✅ ${volunteer.fullName} → ${group.name}`
        );

    }

    console.log("\n🎉 Volunteer Schedules Created!");
    }

main()
    .then(async () => {
        console.log("\n==================================");
        console.log("🎉 Database Seeded Successfully!");
        console.log("==================================");

        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error("\n❌ Seeding Failed!");
        console.error(error);

        await prisma.$disconnect();
        process.exit(1);
    });