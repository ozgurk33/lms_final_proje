/**
 * Auto-grading Service
 * Supports all question types
 * Rule: Exact match = full points, otherwise zero
 */

export const gradeQuiz = (questions, userAnswers) => {
    let totalScore = 0;
    const results = [];

    questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = gradeQuestion(question, userAnswer);

        // Add points if correct (exact match only)
        const earnedPoints = isCorrect === true ? question.points : 0;
        totalScore += earnedPoints;

        results.push({
            questionId: question.id,
            userAnswer,
            correctAnswer: question.correctAnswer,
            isCorrect,
            points: earnedPoints
        });
    });

    return {
        totalScore,
        results
    };
};

const gradeQuestion = (question, userAnswer) => {
    // Get original type from options if available
    const originalType = question.options?.originalType || question.type;
    const type = originalType?.toLowerCase?.() || question.type;

    // Handle null/undefined answers
    if (userAnswer === null || userAnswer === undefined || userAnswer === '') {
        return false;
    }

    switch (type) {
        // Multiple Choice (single answer)
        case 'multiple_choice':
        case 'MULTIPLE_CHOICE':
            return gradeMultipleChoice(question.correctAnswer, userAnswer, question.options);

        // Multiple Select (multiple answers)
        case 'multiple_select':
            return gradeMultipleSelect(question.correctAnswer, userAnswer);

        // True/False
        case 'true_false':
        case 'TRUE_FALSE':
            return gradeTrueFalse(question.correctAnswer, userAnswer);

        // Yes/No
        case 'yes_no':
            return gradeYesNo(question.correctAnswer, userAnswer);

        // Fill in the Blank
        case 'fill_blank':
        case 'fill_in_blank':
        case 'FILL_IN_BLANK':
            return gradeFillInBlank(question.correctAnswer, userAnswer);

        // Short Answer
        case 'short_answer':
        case 'SHORT_ANSWER':
            return gradeShortAnswer(question.correctAnswer, userAnswer);

        // Numerical
        case 'numerical':
            return gradeNumerical(question.correctAnswer, userAnswer, question.options?.tolerance);

        // Matching
        case 'matching':
        case 'MATCHING':
            return gradeMatching(question.options?.pairs, userAnswer);

        // Ordering
        case 'ordering':
        case 'ORDERING':
            return gradeOrdering(question.options?.items, userAnswer);

        // Dropdown (same as multiple choice)
        case 'dropdown':
            return gradeMultipleChoice(question.correctAnswer, userAnswer, question.options);

        // Checklist
        case 'checklist':
            return gradeChecklist(question.options?.correctItems, userAnswer);

        // Rating Scale (feedback - always "correct")
        case 'rating_scale':
            return true;

        // Likert Scale (feedback - always "correct")
        case 'likert_scale':
            return true;

        // Essay/Long Answer - requires manual grading
        case 'essay':
        case 'long_answer':
        case 'LONG_ANSWER':
        case 'OPEN_ENDED':
            // For now, give points if answer is provided (manual review needed)
            return userAnswer && userAnswer.length > 10 ? null : false;

        // Grid - requires manual grading
        case 'grid':
            return null;

        default:
            // Unknown type - try simple comparison
            return normalizeAnswer(question.correctAnswer) === normalizeAnswer(userAnswer);
    }
};

// Multiple Choice (single answer)
const gradeMultipleChoice = (correctAnswer, userAnswer, options) => {
    // correctAnswer might be index or actual value
    let correctValue = correctAnswer;

    // If correctAnswer is a number, get the actual option value
    if (typeof correctAnswer === 'number' && options?.choices) {
        correctValue = options.choices[correctAnswer];
    }

    return normalizeAnswer(correctValue) === normalizeAnswer(userAnswer);
};

// Multiple Select (multiple answers)
const gradeMultipleSelect = (correctAnswers, userAnswers) => {
    if (!Array.isArray(correctAnswers) || !Array.isArray(userAnswers)) {
        return false;
    }

    // All correct answers must be selected, and only correct answers
    if (correctAnswers.length !== userAnswers.length) {
        return false;
    }

    const normalizedCorrect = correctAnswers.map(a => normalizeAnswer(a)).sort();
    const normalizedUser = userAnswers.map(a => normalizeAnswer(a)).sort();

    return normalizedCorrect.every((ans, idx) => ans === normalizedUser[idx]);
};

// True/False
const gradeTrueFalse = (correctAnswer, userAnswer) => {
    const correct = String(correctAnswer).toLowerCase();
    const user = String(userAnswer).toLowerCase();
    return correct === user;
};

// Yes/No
const gradeYesNo = (correctAnswer, userAnswer) => {
    const correct = String(correctAnswer).toLowerCase();
    const user = String(userAnswer).toLowerCase();
    return correct === user;
};

// Fill in the Blank
const gradeFillInBlank = (correctAnswer, userAnswer) => {
    return normalizeAnswer(correctAnswer) === normalizeAnswer(userAnswer);
};

// Short Answer
const gradeShortAnswer = (correctAnswer, userAnswer) => {
    return normalizeAnswer(correctAnswer) === normalizeAnswer(userAnswer);
};

// Numerical (with tolerance)
const gradeNumerical = (correctAnswer, userAnswer, tolerance = 0) => {
    const correct = parseFloat(correctAnswer);
    const user = parseFloat(userAnswer);

    if (isNaN(correct) || isNaN(user)) {
        return false;
    }

    return Math.abs(correct - user) <= parseFloat(tolerance || 0);
};

// Matching
const gradeMatching = (pairs, userAnswer) => {
    if (!pairs || !userAnswer || typeof userAnswer !== 'object') {
        return false;
    }

    // Check each pair
    for (let i = 0; i < pairs.length; i++) {
        const correctRight = pairs[i].right;
        const userRight = userAnswer[i];

        if (normalizeAnswer(correctRight) !== normalizeAnswer(userRight)) {
            return false;
        }
    }

    return true;
};

// Ordering
const gradeOrdering = (items, userAnswer) => {
    if (!items || !userAnswer || typeof userAnswer !== 'object') {
        return false;
    }

    // Correct order is 1, 2, 3, ... (1-indexed)
    for (let i = 0; i < items.length; i++) {
        if (parseInt(userAnswer[i]) !== i + 1) {
            return false;
        }
    }

    return true;
};

// Checklist
const gradeChecklist = (correctItems, userAnswer) => {
    if (!Array.isArray(correctItems) || !Array.isArray(userAnswer)) {
        return false;
    }

    // Sort both arrays and compare
    const sortedCorrect = [...correctItems].sort();
    const sortedUser = [...userAnswer].sort();

    if (sortedCorrect.length !== sortedUser.length) {
        return false;
    }

    return sortedCorrect.every((item, idx) => item === sortedUser[idx]);
};

// Normalize answer for comparison
const normalizeAnswer = (answer) => {
    if (answer === null || answer === undefined) return '';
    if (typeof answer !== 'string') return String(answer);
    return answer.trim().toLowerCase();
};
