
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const attempts = await prisma.quizAttempt.findMany({
            orderBy: { startedAt: 'desc' },
            take: 3,
            select: {
                id: true,
                userId: true,
                startedAt: true,
                completedAt: true,
                score: true
            }
        });
        console.log(JSON.stringify(attempts, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
