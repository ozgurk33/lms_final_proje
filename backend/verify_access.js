
import fetch from 'node-fetch'; // or global fetch if node 18+
// Using plain http for simplicity if fetch not available globally, 
// but let's assume we can use a simple async IIFE with native fetch if Node 18+ 
// or I'll just use a simple requester helper.

// Let's assume the backend is running on localhost:5000 (based on previous logs/context)
const BASE_URL = 'http://localhost:3000/api';

async function request(method, url, token = null, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
        method,
        headers,
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${url}`, options);
    const data = await res.json().catch(() => ({}));
    if (res.status >= 400) {
        console.log(`Error ${res.status} on ${url}:`, JSON.stringify(data));
    }
    return { status: res.status, data };
}

async function main() {
    console.log('Starting verification...');

    // 1. Login as Admin
    // Assuming default admin credentials or ability to create one? 
    // Actually, I'll create a new user to register as instructor/student if needed, 
    // or use existing ones. 
    // I don't have credentials. I should probably "register" new users.

    const adminUser = { username: 'admin_test_' + Date.now(), password: 'password123', email: 'admin' + Date.now() + '@test.com', fullName: 'Admin' };
    // This expects the system to allow registration or valid login. 
    // If registration is open:

    // Let's try to register 3 users: Instructor, Student1 (Enrolled), Student2 (Outsider)
    // Actually, to create a course, I need minimal role INSTRUCTOR.

    const instructor = { username: 'inst_' + Date.now(), password: 'Password123!', email: 'inst' + Date.now() + '@test.com', fullName: 'Inst' };
    const student1 = { username: 's1_' + Date.now(), password: 'Password123!', email: 's1' + Date.now() + '@test.com', fullName: 'S1' };
    const student2 = { username: 's2_' + Date.now(), password: 'Password123!', email: 's2' + Date.now() + '@test.com', fullName: 'S2' };

    // Register Instructor
    let res = await request('POST', '/auth/register', null, instructor);
    if (res.status === 201 || res.status === 200) {
        console.log('Instructor registered');
    } else {
        console.log('Failed to register instructor, trying login?', res.data);
        // If fail, we might be blocked. But let's assume register works.
    }

    // Login Instructor
    res = await request('POST', '/auth/login', null, { usernameOrEmail: instructor.username, password: instructor.password });
    const instToken = res.data.token || res.data.accessToken;
    if (!instToken) {
        console.error('Failed to login instructor', res.data);
        return;
    }

    // Register Student 1
    await request('POST', '/auth/register', null, student1);
    res = await request('POST', '/auth/login', null, { usernameOrEmail: student1.username, password: student1.password });
    const s1Token = res.data.token || res.data.accessToken;

    // Register Student 2
    await request('POST', '/auth/register', null, student2);
    res = await request('POST', '/auth/login', null, { usernameOrEmail: student2.username, password: student2.password });
    const s2Token = res.data.token || res.data.accessToken;

    // Create Course (Instructor)
    // First, maybe I need to update role to INSTRUCTOR? 
    // Default register might be STUDENT. 
    // I can't easily change role via API unless I am admin.
    // I'll assume I can just use an existing admin or similar if possible.
    // OR, I can check if I can just assume the backend has some seeding.

    // PLAN B: Use the 'register' logic but if I can't create course (403), I will fail.
    // If I can't create course as default user, I'll need to use the `admin` user if I knew the pass.

    // Let's try to grab an existing user or just rely on manual verification if this gets too complex.
    // BUT! I can check if `admin` / `password123` or similar works.
    // Or simpler: I'll just try to create a course as the new user. If it fails, I'll skip setup and just output "Setup failed, please test manually"

    console.log('Attempting to create course...');
    res = await request('POST', '/courses', instToken, { title: 'Test Course', description: 'Desc', category: 'IT' });
    if (res.status === 403) {
        console.log('New user cannot create course. Trying to enroll self in existing course?');
        // If I can't create course, I can't automate easily without known credentials.
        // I will assume for now I cannot fully automate without checking DB/Seeding.
        // I'll write the script to BE CAPABLE if roles allow, or report failure.
        console.log('Cannot create course, skipping automated setup.');
        return;
    }
    const courseId = res.data.course.id;
    console.log('Course created:', courseId);

    // Create Quiz
    res = await request('POST', '/quizzes', instToken, {
        title: 'Test Quiz',
        courseId: courseId,
        questions: [{ type: 'MULTIPLE_CHOICE', content: 'Q1?', options: ['A', 'B'], correctAnswer: 'A', points: 10 }]
    });
    const quizId = res.data.quiz.id;
    console.log('Quiz created:', quizId);

    // Enroll Student 1
    console.log('Enrolling Student 1...');
    await request('POST', `/courses/${courseId}/enroll`, s1Token);

    // TEST 1: Student 1 (Enrolled) - List Quizzes
    res = await request('GET', `/quizzes?courseId=${courseId}`, s1Token);
    console.log('TEST 1: Enrolled student list quizzes (Expect 1):', res.data.quizzes?.length === 1 ? 'PASS' : 'FAIL');

    // TEST 2: Student 2 (Not Enrolled) - List Quizzes
    res = await request('GET', `/quizzes?courseId=${courseId}`, s2Token);
    // Should be filtered out? My code filters by "enrolledCourseIds".
    // If I pass courseId query param, and I'm not enrolled, my logic: 
    // 1. Get my enrollments (empty). 
    // 2. Filter quizzes where courseId in []. 
    // 3. Result: empty.
    console.log('TEST 2: Outsider student list quizzes (Expect 0):', res.data.quizzes?.length === 0 ? 'PASS' : 'FAIL');

    // TEST 3: Student 2 - Get Quiz By ID
    res = await request('GET', `/quizzes/${quizId}`, s2Token);
    console.log('TEST 3: Outsider accessing quiz directly (Expect 403):', res.status === 403 ? 'PASS' : `FAIL (${res.status})`);

    // TEST 4: Student 1 - Start Quiz
    res = await request('POST', `/quizzes/${quizId}/start`, s1Token);
    console.log('TEST 4: Enrolled student start quiz (Expect 200/201):', (res.status === 200 || res.status === 201) ? 'PASS' : `FAIL (${res.status})`);

    // TEST 5: Student 2 - Start Quiz
    res = await request('POST', `/quizzes/${quizId}/start`, s2Token);
    console.log('TEST 5: Outsider start quiz (Expect 403):', res.status === 403 ? 'PASS' : `FAIL (${res.status})`);
}

main();
