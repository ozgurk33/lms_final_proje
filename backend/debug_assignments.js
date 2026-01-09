import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAssignments() {
    console.log('Checking Course Assignments...');

    console.log('\n--- Users (Instructors) ---');
    const instructors = await prisma.user.findMany({
        where: { role: { in: ['INSTRUCTOR', 'ADMIN'] } },
        select: { id: true, username: true, fullName: true, role: true }
    });
    console.table(instructors);

    console.log('\n--- Courses (instructorId field) ---');
    const courses = await prisma.course.findMany({
        select: { id: true, title: true, instructorId: true }
    });
    console.table(courses);

    console.log('\n--- CourseInstructor (Join Table) ---');
    const assignments = await prisma.courseInstructor.findMany({
        include: {
            user: { select: { username: true } },
            course: { select: { title: true } }
        }
    });
    console.log(JSON.stringify(assignments, null, 2));

    await prisma.$disconnect();
}

checkAssignments().catch(e => {
    console.error(e);
    prisma.$disconnect();
});
