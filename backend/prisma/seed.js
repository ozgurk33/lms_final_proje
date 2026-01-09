import prisma from '../src/config/database.js';
import bcrypt from 'bcrypt';

/**
 * Seed database with comprehensive test data
 * - 1 Admin
 * - 2 Instructors
 * - 30 Students (University grade 1-4)
 * - 5 Courses
 */

async function main() {
    console.log('🌱 Seeding database with comprehensive test data...\n');

    // Clear existing data
    console.log('⚠️  Clearing existing data...');
    await prisma.courseInstructor.deleteMany();
    await prisma.quizAttempt.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.module.deleteMany();
    await prisma.course.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Data cleared\n');

    const hashedPassword = await bcrypt.hash('Test123!@#', 12);

    // 1. Create Admin
    console.log('👤 Creating admin...');
    const admin = await prisma.user.create({
        data: {
            username: 'admin',
            email: 'admin@university.edu',
            password: hashedPassword,
            fullName: 'Admin User',
            role: 'SUPER_ADMIN',
            isActive: true
        }
    });
    console.log(`  ✅ ${admin.username} (${admin.role})\n`);

    // 2. Create 2 Instructors
    console.log('👨‍🏫 Creating instructors...');
    const instructor1 = await prisma.user.create({
        data: {
            username: 'instructor1',
            email: 'john.smith@university.edu',
            password: hashedPassword,
            fullName: 'Prof. John Smith',
            role: 'INSTRUCTOR',
            isActive: true
        }
    });

    const instructor2 = await prisma.user.create({
        data: {
            username: 'instructor2',
            email: 'jane.doe@university.edu',
            password: hashedPassword,
            fullName: 'Prof. Jane Doe',
            role: 'INSTRUCTOR',
            isActive: true
        }
    });
    console.log(`  ✅ ${instructor1.fullName} (${instructor1.email})`);
    console.log(`  ✅ ${instructor2.fullName} (${instructor2.email})\n`);

    // 3. Create 30 Students with realistic data
    console.log('👨‍🎓 Creating 30 students...');

    const studentData = [
        // 1. Sınıf (Freshman) - 8 students
        { name: 'Ahmet Yılmaz', grade: 1 },
        { name: 'Ayşe Kaya', grade: 1 },
        { name: 'Mehmet Can', grade: 1 },
        { name: 'Fatma Demir', grade: 1 },
        { name: 'Ali Öztürk', grade: 1 },
        { name: 'Zeynep Arslan', grade: 1 },
        { name: 'Mustafa Yıldız', grade: 1 },
        { name: 'Elif Çelik', grade: 1 },

        // 2. Sınıf (Sophomore) - 8 students
        { name: 'Emre Şahin', grade: 2 },
        { name: 'Büşra Aydın', grade: 2 },
        { name: 'Hakan Korkmaz', grade: 2 },
        { name: 'Selin Özkan', grade: 2 },
        { name: 'Oğuz Polat', grade: 2 },
        { name: 'Merve Erdoğan', grade: 2 },
        { name: 'Burak Aksoy', grade: 2 },
        { name: 'İrem Yılmaz', grade: 2 },

        // 3. Sınıf (Junior) - 7 students
        { name: 'Serkan Koç', grade: 3 },
        { name: 'Derya Güneş', grade: 3 },
        { name: 'Tolga Özdemir', grade: 3 },
        { name: 'Ceren Aktaş', grade: 3 },
        { name: 'Kaan Çetin', grade: 3 },
        { name: 'Gamze Şimşek', grade: 3 },
        { name: 'Cem Karaca', grade: 3 },

        // 4. Sınıf (Senior) - 7 students
        { name: 'Berk Yalçın', grade: 4 },
        { name: 'Tuğba Kurt', grade: 4 },
        { name: 'Onur Bayrak', grade: 4 },
        { name: 'Pelin Kaplan', grade: 4 },
        { name: 'Murat Güler', grade: 4 },
        { name: 'Deniz Yıldırım', grade: 4 },
        { name: 'Esra Tunç', grade: 4 }
    ];

    for (let i = 0; i < studentData.length; i++) {
        const { name, grade } = studentData[i];
        const username = `student${i + 1}`;
        const email = name.toLowerCase()
            .replace(/\s/g, '.')
            .replace(/ı/g, 'i')
            .replace(/ö/g, 'o')
            .replace(/ü/g, 'u')
            .replace(/ş/g, 's')
            .replace(/ç/g, 'c')
            .replace(/ğ/g, 'g') + '@student.university.edu';

        await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                fullName: name,
                role: 'STUDENT',
                grade,
                isActive: true
            }
        });
        console.log(`  ✅ ${username} - ${name} (Grade ${grade}) - ${email}`);
    }
    console.log('');

    // 4. Create 5 Courses
    console.log('📚 Creating courses...');

    const courses = [
        {
            title: 'Introduction to Programming',
            description: 'Learn the basics of programming with Python. Covers variables, loops, functions, and basic data structures.',
            category: 'Computer Science',
            isPublished: true
        },
        {
            title: 'Web Development',
            description: 'Full-stack web development with HTML, CSS, JavaScript, React, and Node.js.',
            category: 'Computer Science',
            isPublished: true
        },
        {
            title: 'Database Systems',
            description: 'Relational database design, SQL, normalization, and database management.',
            category: 'Computer Science',
            isPublished: true
        },
        {
            title: 'Data Structures & Algorithms',
            description: 'Essential data structures and algorithms for efficient problem solving.',
            category: 'Computer Science',
            isPublished: true
        },
        {
            title: 'Software Engineering',
            description: 'Software development methodologies, design patterns, and best practices.',
            category: 'Computer Science',
            isPublished: true
        }
    ];

    for (const courseData of courses) {
        const course = await prisma.course.create({
            data: {
                ...courseData,
                instructorId: instructor1.id
            }
        });
        console.log(`  ✅ ${course.title}`);
    }
    console.log('');

    console.log('✨ Seeding completed!\n');
    console.log('📊 Summary:');
    console.log('  - 1 Admin (admin)');
    console.log('  - 2 Instructors (instructor1, instructor2)');
    console.log('  - 30 Students (student1-30, Grade 1-4)');
    console.log('  - 5 Courses (unassigned)\n');

    console.log('🎓 Grade Distribution:');
    console.log('  - Grade 1 (Freshman): 8 students');
    console.log('  - Grade 2 (Sophomore): 8 students');
    console.log('  - Grade 3 (Junior): 7 students');
    console.log('  - Grade 4 (Senior): 7 students\n');

    console.log('🔐 Test Credentials (Password: Test123!@#):');
    console.log('  Admin:       admin');
    console.log('  Instructor1: instructor1 (Prof. John Smith)');
    console.log('  Instructor2: instructor2 (Prof. Jane Doe)');
    console.log('  Students:    student1 - student30\n');

    console.log('🧪 Test Flow:');
    console.log('  1. Login as admin → Assign courses to instructors');
    console.log('  2. Login as instructor → View All Students');
    console.log('  3. Login as instructor → Create quizzes');
    console.log('  4. Login as instructor → Assign students to courses');
    console.log('  5. Login as student → View courses and take quizzes\n');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
