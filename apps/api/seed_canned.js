// Quick seed script: adds default canned responses for all existing tenants
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaults = [
    { shortcut: 'greeting', title: 'Greeting', content: 'Hello! How can I help you today? 😊' },
    { shortcut: 'thanks', title: 'Thank You', content: 'Thank you for reaching out! Is there anything else I can help you with?' },
    { shortcut: 'wait', title: 'Ask to Wait', content: 'Please give me a moment while I look into this for you. I\'ll be right back! 🙏' },
    { shortcut: 'bye', title: 'Goodbye', content: 'Thank you for chatting with us today! Have a great day. Goodbye! 👋' },
    { shortcut: 'escalate', title: 'Escalate Issue', content: 'I understand your concern. Let me connect you with our specialist who can better assist you with this issue.' },
    { shortcut: 'sorry', title: 'Apology', content: 'I\'m sorry for the inconvenience caused. We take this seriously and will do our best to resolve it as quickly as possible.' },
];

async function seed() {
    const tenants = await prisma.tenant.findMany({ select: { id: true, name: true } });
    console.log(`Found ${tenants.length} tenant(s)`);

    for (const tenant of tenants) {
        console.log(`\nSeeding for tenant: ${tenant.name} (${tenant.id})`);
        for (const item of defaults) {
            try {
                await prisma.cannedResponse.create({
                    data: { tenantId: tenant.id, ...item }
                });
                console.log(`  ✅ Created /${item.shortcut}`);
            } catch (e) {
                // Skip if already exists (unique constraint)
                console.log(`  ⏭️  /${item.shortcut} already exists`);
            }
        }
    }
    console.log('\nDone!');
}

seed().finally(() => prisma.$disconnect());
