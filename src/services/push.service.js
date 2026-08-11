const webpush = require("web-push");
const prisma = require("../config/prisma");

// ======================================
// VAPID CONFIGURATION
// ======================================

webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// ======================================
// SEND PUSH TO USER
// ======================================

exports.sendPushToUser = async (
    userId,
    title,
    message,
    url = "/volunteer-dashboard.html"
) => {

    try {

        const subscriptions =
            await prisma.pushSubscription.findMany({
                where: {
                    userId
                }
            });

        if (subscriptions.length === 0) {

            console.log(
                `ℹ️ No push subscription found for user: ${userId}`
            );

            return {
                success: false,
                sent: 0
            };

        }

        const payload = JSON.stringify({

            title,

            body: message,

            icon: "/assets/logo.webp",

            badge: "/assets/logo.webp",

            data: {
                url
            }

        });

        let sent = 0;

        for (const sub of subscriptions) {

            const pushSubscription = {

                endpoint: sub.endpoint,

                keys: {

                    p256dh: sub.p256dh,

                    auth: sub.auth

                }

            };

            try {

                await webpush.sendNotification(
                    pushSubscription,
                    payload
                );

                sent++;

                console.log(
                    `✅ Push sent to user ${userId}`
                );

            }

            catch (error) {

                console.error(
                    `❌ Push failed for user ${userId}:`,
                    error.statusCode,
                    error.message
                );

                // ======================================
                // REMOVE EXPIRED SUBSCRIPTION
                // ======================================

                if (
                    error.statusCode === 404 ||
                    error.statusCode === 410
                ) {

                    await prisma.pushSubscription.delete({
                        where: {
                            id: sub.id
                        }
                    });

                    console.log(
                        `🗑️ Removed expired subscription ${sub.id}`
                    );

                }

            }

        }

        return {
            success: sent > 0,
            sent
        };

    }

    catch (error) {

        console.error(
            "❌ Send Push Error:",
            error
        );

        return {
            success: false,
            sent: 0
        };

    }

};