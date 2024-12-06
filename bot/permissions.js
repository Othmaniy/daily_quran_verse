// bot/permissions.js
const  isUserAdmin=async(bot, groupChatId, userId)=> {
    try {
        const chatMember = await bot.getChatMember(groupChatId, userId);
        console.log("chatmember");
        console.log(chatMember);
        // Check if the user is an admin or the group creator
        if (chatMember.status === "administrator" || chatMember.status === "creator") {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.error("Error checking user admin status:", err);
        throw new Error("Unable to verify admin status. Ensure the bot has appropriate permissions in the group.");
    }
}

module.exports={
    isUserAdmin
}
