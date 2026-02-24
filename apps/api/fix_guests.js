const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixGuestVisitors() {
    const guestUsers = await prisma.endUser.findMany({
        where: { name: 'Guest Visitor' }
    });

    console.log(`Found ${guestUsers.length} users with 'Guest Visitor' name`);

    for (const user of guestUsers) {
        if (!user.externalId) continue;

        // Extract the last 6 digits of the ID for a unique label
        const idParts = user.externalId.split('-');
        const rawId = idParts[idParts.length - 1];  // last part after hyphen

        // Only rename if the ID looks like a Facebook numeric ID (15+ digits)
        if (rawId && /^\d{15,}$/.test(rawId)) {
            const newName = `FB User #${rawId.slice(-6)}`;
            await prisma.endUser.update({
                where: { id: user.id },
                data: { name: newName }
            });
            console.log(`Updated: ${user.externalId} -> ${newName}`);
        }
    }

    console.log('Done!');
}

fixGuestVisitors().finally(() => prisma.$disconnect());
