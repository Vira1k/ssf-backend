const PDFDocument = require("pdfkit");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ======================================
// ADD TEACHING REPORT
// ======================================

exports.addReport = async (req, res) => {

    try {

        const volunteerId = req.user.id;

        const {
            groupId,
            subject,
            whatTaught,
            homework,
            nextClassPlan,
            reportDate
        } = req.body;

        if (!groupId || !subject || !whatTaught) {

            return res.status(400).json({

                success: false,

                message: "Group, Subject and What Taught are required."

            });

        }

        const report = await prisma.teachingReport.create({

            data: {

                volunteerId,

                groupId: Number(groupId),

                subject,

                whatTaught,

                homework,

                nextClassPlan,

                reportDate: reportDate
                    ? new Date(reportDate)
                    : new Date()

            }

        });

        res.status(201).json({

            success: true,

            message: "Teaching report submitted successfully.",

            data: report

        });

    } catch (error) {

        console.error("Add Report Error:", error);

        res.status(500).json({

            success: false,

            message: "Failed to submit report."

        });

    }

};

// ======================================
// GET ALL TEACHING REPORTS
// ======================================

exports.getAllReports = async (req, res) => {

    try {

        const reports = await prisma.teachingReport.findMany({

            include: {

                volunteer: {

                    select: {

                        id: true,

                        fullName: true

                    }

                },

                group: {

                    include: {

                        camp: {

                            select: {

                                id: true,

                                name: true

                            }

                        }

                    }

                }

            },

            orderBy: {

                reportDate: "desc"

            }

        });

        const formattedReports = reports.map(report => ({

            id: report.id,

            reportDate: report.reportDate,

            subject: report.subject,

            whatTaught: report.whatTaught,

            homework: report.homework,

            nextClassPlan: report.nextClassPlan,

            volunteer: {

                id: report.volunteer.id,

                fullName: report.volunteer.fullName

            },

            group: {

                id: report.group.id,

                name: report.group.name

            },

            camp: {

                id: report.group.camp.id,

                name: report.group.camp.name

            }

        }));

        res.status(200).json({

            success: true,

            count: formattedReports.length,

            data: formattedReports

        });

    } catch (error) {

        console.error("Get Reports Error:", error);

        res.status(500).json({

            success: false,

            message: "Unable to fetch reports."

        });

    }

};
// ======================================
// DOWNLOAD REPORTS PDF
// ======================================

exports.downloadReportsPDF = async (req, res) => {

    try {


        const reports =
        await prisma.teachingReport.findMany({

            include: {

                volunteer: {

                    select: {

                        fullName:true

                    }

                },


                group: {

                    include: {

                        camp: {

                            select: {

                                name:true

                            }

                        }

                    }

                }

            },


            orderBy:{

                reportDate:"desc"

            }

        });



        const doc =
        new PDFDocument({
            margin:50
        });



        res.setHeader(
            "Content-Type",
            "application/pdf"
        );


        res.setHeader(
            "Content-Disposition",
            "attachment; filename=SSF_Teaching_Reports.pdf"
        );



        doc.pipe(res);



        // TITLE

        doc
        .fontSize(20)
        .text(
            "Slum Swaraj Foundation",
            {
                align:"center"
            }
        );


        doc
        .fontSize(16)
        .text(
            "Teaching Reports",
            {
                align:"center"
            }
        );


        doc.moveDown();



        reports.forEach((report,index)=>{


            doc
            .fontSize(14)
            .text(
                `Report ${index+1}`,
                {
                    underline:true
                }
            );


            doc.moveDown(0.5);



            doc.fontSize(11)
            .text(
`Date: ${new Date(report.reportDate).toLocaleDateString()}

Volunteer: ${report.volunteer?.fullName || "-"}

Camp: ${report.group?.camp?.name || "-"}

Group: ${report.group?.name || "-"}

Subject: ${report.subject || "-"}

Topic Covered:
${report.whatTaught || "-"}

Homework:
${report.homework || "-"}

Next Class Plan:
${report.nextClassPlan || "-"}

`
            );



            doc.moveDown();



            if(index !== reports.length-1){

                doc.addPage();

            }


        });



        doc.end();



    }
    catch(error){


        console.error(
            "PDF Download Error:",
            error
        );


        res.status(500).json({

            success:false,

            message:
            "Unable to generate PDF"

        });


    }

};