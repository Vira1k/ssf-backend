// ======================================
// SSF WhatsApp Service (Demo Version)
// ======================================


// Generate WhatsApp Message Link
exports.createWhatsAppLink = (
    mobile,
    message
) => {


    // Remove spaces and special characters

    const phone =
        mobile.replace(
            /\D/g,
            ""
        );


    const encodedMessage =
        encodeURIComponent(
            message
        );


    return `https://wa.me/${phone}?text=${encodedMessage}`;

};



// ======================================
// Create Schedule Message
// ======================================

exports.scheduleMessage = ({
    volunteerName,
    mobile,
    groupName,
    subject,
    day,
    time

}) => {


    const message = `Hello ${volunteerName} 👋


Your SSF teaching schedule has been assigned.


📚 Group: ${groupName}

📖 Subject: ${subject}

📅 Day: ${day}

⏰ Time: ${time}


Please be available on time.


- Slum Swaraj Foundation`;


    return {

        message,

        whatsappLink:
            exports.createWhatsAppLink(
                mobile,
                message
            )

    };


};