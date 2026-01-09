
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function request(method, url, token = null, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${url}`, options);
    const data = await res.json().catch(() => ({}));
    if (res.status >= 400) {
        console.log(`Error ${res.status} on ${url}:`, JSON.stringify(data));
    }
    return { status: res.status, data };
}

async function main() {
    console.log('Starting Grading Verification...');

    // 1. Register/Login as Instructor
    const instructor = { username: 'inst_gr_' + Date.now(), password: 'Password123!', email: 'inst_gr' + Date.now() + '@test.com', fullName: 'Inst Grading' };
    // Temporarily rely on manual role switch or existing student if not allowed? 
    // Wait, I reverted authController. I need to re-enable it or use existing logic?
    // Actually, I can just register a student and use an existing quiz IF I knew ID.
    // Better to re-enable INSTRUCTOR creation for this test.

    // Enabling Auth Controller Change Logic (Mocking it here by assuming I'll enable it before run or use existing user)
    // Actually, I'll just try to use the previous instructor if I can? No, stateless.
    // I will use another tool to enable Instructor creation momentarily.

    await request('POST', '/auth/register', null, instructor);
    let res = await request('POST', '/auth/login', null, { usernameOrEmail: instructor.username, password: instructor.password });
    const token = res.data.token || res.data.accessToken;

    if (!token) {
        console.log('Login failed (likely need INSTRUCTOR role hack again).');
        return;
    }

    // 2. Create Course/Quiz
    res = await request('POST', '/courses', token, { title: 'Grading Test Course', description: 'Desc', category: 'Testing' });
    if (res.status !== 201) return; // likely forbidden
    const courseId = res.data.course.id;

    const quizData = {
        title: 'Grading Quiz',
        courseId,
        questions: [
            {
                type: 'OPEN_ENDED',
                content: 'Say hello',
                correctAnswer: 'Hello',
                points: 10,
                order: 0
            }
        ]
    };

    res = await request('POST', '/quizzes', token, quizData);
    const quizId = res.data.quiz.id;
    console.log('Quiz Created:', quizId);

    // 3. Register Student
    const student = { username: 'stud_gr_' + Date.now(), password: 'Password123!', email: 'stud_gr' + Date.now() + '@test.com', fullName: 'Student Grading' };
    await request('POST', '/auth/register', null, student);
    res = await request('POST', '/auth/login', null, { usernameOrEmail: student.username, password: student.password });
    const studentToken = res.data.token || res.data.accessToken;

    // Enroll
    await request('POST', `/courses/${courseId}/enroll`, studentToken);

    // 4. Start Quiz
    res = await request('POST', `/quizzes/${quizId}/start`, studentToken);
    const attemptId = res.data.attempt.id;

    // 5. Submit Quiz with case variance
    // Front end sends array of answers.
    const answers = ['hello']; // lowercase implementation of 'Hello'

    res = await request('POST', `/quizzes/${quizId}/submit`, studentToken, {
        attemptId,
        answers
    });

    console.log('Submit Result:', JSON.stringify(res.data, null, 2));

    if (res.data.isPassed && res.data.totalScore === 10) {
        console.log('SUCCESS: Grading is case-insensitive.');
    } else {
        console.log('FAILURE: Grading incorrect.');
    }
}

main();
