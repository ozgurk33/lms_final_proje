
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function request(method, url, token = null, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${url}`, options);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

async function main() {
    console.log('Starting Debug...');

    // 1. Register Instructor & Student
    const ts = Date.now();
    const inst = { username: 'inst_' + ts, password: 'Password123!', email: 'inst_' + ts + '@test.com', fullName: 'Inst Debug' };
    const stud = { username: 'stud_' + ts, password: 'Password123!', email: 'stud_' + ts + '@test.com', fullName: 'Stud Debug' };

    await request('POST', '/auth/register', null, inst);
    const instLogin = await request('POST', '/auth/login', null, { usernameOrEmail: inst.username, password: inst.password });
    const instToken = instLogin.data.token || instLogin.data.accessToken;

    await request('POST', '/auth/register', null, stud);
    const studLogin = await request('POST', '/auth/login', null, { usernameOrEmail: stud.username, password: stud.password });
    const studToken = studLogin.data.token || studLogin.data.accessToken;

    // 2. Create Quiz (Open Ended)
    const quizRes = await request('POST', '/courses', instToken, { title: 'Debug Course', description: 'D', category: 'Debug' });
    if (quizRes.status >= 400) {
        console.log('Course Create Failed:', JSON.stringify(quizRes.data));
        return;
    }
    const courseId = quizRes.data.course.id;

    const quizData = {
        title: 'Debug Quiz',
        courseId,
        questions: [{ type: 'OPEN_ENDED', content: 'Say Hi', correctAnswer: 'Hi', points: 10, order: 0 }]
    };
    const qRes = await request('POST', '/quizzes', instToken, quizData);
    if (qRes.status >= 400) {
        console.log('Quiz Create Failed:', JSON.stringify(qRes.data));
        return;
    }
    const quizId = qRes.data.quiz.id;

    await request('POST', `/courses/${courseId}/enroll`, studToken);

    // 3. Take Quiz
    const start = await request('POST', `/quizzes/${quizId}/start`, studToken);
    const attemptId = start.data.attempt.id;

    // 4. Submit
    const answers = ['Hi'];
    const submit = await request('POST', `/quizzes/${quizId}/submit`, studToken, { attemptId, answers });
    console.log('Submit Score:', submit.data.percentage);

    // 5. Get Details (The broken part?)
    const details = await request('GET', `/api/quizzes/${quizId}/attempts/${attemptId}`, studToken); // Wait, route is /quizzes/:id/attempts/:attemptId directly on router
    // Router path: /api/quizzes/:id/attempts/:attemptId
    // My request helper adds /api prefix if I put it in url? No, helper adds BASE_URL which ends in /api.
    // So url should be /quizzes/...

    const detailsRes = await request('GET', `/quizzes/${quizId}/attempts/${attemptId}`, studToken);

    console.log('Details Status:', detailsRes.status);
    console.log('Details Data:', JSON.stringify(detailsRes.data, null, 2));

    if (detailsRes.data.totalScore === 0 && submit.data.totalScore > 0) {
        console.log('FAILURE: Re-grading mismatch detected!');
    } else {
        console.log('SUCCESS: Scores match.');
    }
}

main();
