import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEnrollments() {
    console.log('Checking Enrollments...');

    // Find Ahmet Yılmaz
    const user = await prisma.user.findFirst({
        where: { fullName: { contains: 'Ahmet', mode: 'insensitive' } }
    });

    if (!user) {
        console.log('User "Ahmet" not found');
        return;
    }

    console.log('User:', { id: user.id, username: user.username, role: user.role });

    // Check enrollments for this user
    const enrollments = await prisma.enrollment.findMany({
        where: { userId: user.id },
        include: {
            course: true
        }
    });

    console.log(`Found ${enrollments.length} enrollments:`);
    console.log(JSON.stringify(enrollments, null, 2));

    await prisma.$disconnect();
}

checkEnrollments().catch(e => {
    console.error(e);
    prisma.$disconnect();
});
