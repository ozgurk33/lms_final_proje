
import fetch from 'node-fetch';

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
    console.log('Starting Open-Ended Question Verification...');

    // 1. Register/Login as Instructor
    const instructor = { username: 'inst_oe_' + Date.now(), password: 'Password123!', email: 'inst_oe' + Date.now() + '@test.com', fullName: 'Inst OE' };

    // Register
    await request('POST', '/auth/register', null, instructor);

    // Login
    let res = await request('POST', '/auth/login', null, { usernameOrEmail: instructor.username, password: instructor.password });
    const token = res.data.token || res.data.accessToken;
    if (!token) {
        console.error('Login failed');
        return;
    }

    // 2. Create Course
    res = await request('POST', '/courses', token, { title: 'Open Ended Test Course', description: 'Desc', category: 'Testing' });
    if (res.status !== 201) {
        console.error('Course creation failed');
        return;
    }
    const courseId = res.data.course.id;

    // 3. Create Quiz with Open Ended Question
    const quizData = {
        title: 'Mixed Quiz',
        courseId: courseId,
        questions: [
            {
                type: 'MULTIPLE_CHOICE',
                content: 'MC Question?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 'A',
                points: 5,
                order: 0
            },
            {
                type: 'OPEN_ENDED',
                content: 'Explain the meaning of life.',
                // options: null, // Explicitly null or undefined
                correctAnswer: '42', // Reference answer for grading?
                points: 10,
                order: 1
            }
        ]
    };

    console.log('Attempting to create quiz with OPEN_ENDED question...');
    res = await request('POST', '/quizzes', token, quizData);

    if (res.status === 201) {
        console.log('SUCCESS: Quiz created with open-ended question.');
    } else {
        console.log('FAILURE: Could not create quiz.');
    }
}

main();
