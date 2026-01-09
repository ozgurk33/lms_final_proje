import { QUESTION_TYPES } from './questionTypes';

/**
 * Auto-Grading System for Quiz Questions
 * Evaluates student answers and returns score
 */

/**
 * Grade a single question
 * @param {Object} question - Question object with type, data, and correct answer
 * @param {any} studentAnswer - Student's submitted answer
 * @returns {Object} { isCorrect: boolean, score: number, feedback: string }
 */
export function gradeQuestion(question, studentAnswer) {
    const questionType = question.type;
    const maxPoints = question.points || 1;

    switch (questionType) {
        case QUESTION_TYPES.MULTIPLE_CHOICE:
            return gradeMultipleChoice(question, studentAnswer, maxPoints);

        case QUESTION_TYPES.MULTIPLE_SELECT:
            return gradeMultipleSelect(question, studentAnswer, maxPoints);

        case QUESTION_TYPES.TRUE_FALSE:
            return gradeTrueFalse(question, studentAnswer, maxPoints);

        case QUESTION_TYPES.SHORT_ANSWER:
            return gradeShortAnswer(question, studentAnswer, maxPoints);

        case QUESTION_TYPES.ESSAY:
            return gradeEssay(question, studentAnswer, maxPoints);

        case QUESTION_TYPES.NUMERICAL:
            return gradeNumerical(question, studentAnswer, maxPoints);

        case QUESTION_TYPES.MATCHING:
            return gradeMatching(question, studentAnswer, maxPoints);

        case QUESTION_TYPES.FILL_BLANK:
            return gradeFillBlank(question, studentAnswer, maxPoints);

        case QUESTION_TYPES.ORDERING:
            return gradeOrdering(question, studentAnswer, maxPoints);

        case QUESTION_TYPES.DROPDOWN:
            return gradeDropdown(question, studentAnswer, maxPoints);

        case QUESTION_TYPES.YES_NO:
            return gradeYesNo(question, studentAnswer, maxPoints);

        case QUESTION_TYPES.RATING_SCALE:
            return gradeRatingScale(question, studentAnswer, maxPoints);

        case QUESTION_TYPES.LIKERT_SCALE:
            return gradeLikertScale(question, studentAnswer, maxPoints);

        case QUESTION_TYPES.CHECKLIST:
            return gradeChecklist(question, studentAnswer, maxPoints);

        case QUESTION_TYPES.GRID:
            return gradeGrid(question, studentAnswer, maxPoints);

        default:
            return {
                isCorrect: false,
                score: 0,
                feedback: 'Unknown question type'
            };
    }
}

// 1. MULTIPLE CHOICE - Single selection
function gradeMultipleChoice(question, studentAnswer, maxPoints) {
    const correctIndex = question.data?.correctAnswer;
    const isCorrect = studentAnswer === correctIndex;

    return {
        isCorrect,
        score: isCorrect ? maxPoints : 0,
        feedback: isCorrect ? 'Correct!' : `Incorrect. Correct answer was: ${question.data?.options?.[correctIndex]}`
    };
}

// 2. MULTIPLE SELECT - Multiple selections
function gradeMultipleSelect(question, studentAnswer, maxPoints) {
    const correctAnswers = question.data?.correctAnswers || [];
    const studentAnswers = Array.isArray(studentAnswer) ? studentAnswer : [];

    // Check if arrays are equal
    const sortedCorrect = [...correctAnswers].sort();
    const sortedStudent = [...studentAnswers].sort();
    const isCorrect = JSON.stringify(sortedCorrect) === JSON.stringify(sortedStudent);

    return {
        isCorrect,
        score: isCorrect ? maxPoints : 0,
        feedback: isCorrect ? 'Correct!' : 'Incorrect. You missed some options or selected wrong ones.'
    };
}

// 3. TRUE/FALSE
function gradeTrueFalse(question, studentAnswer, maxPoints) {
    const correctAnswer = question.data?.correctAnswer;
    const isCorrect = studentAnswer === correctAnswer;

    return {
        isCorrect,
        score: isCorrect ? maxPoints : 0,
        feedback: isCorrect ? 'Correct!' : `Incorrect. Correct answer was: ${correctAnswer}`
    };
}

// 4. SHORT ANSWER - Text comparison (case-insensitive)
function gradeShortAnswer(question, studentAnswer, maxPoints) {
    const correctAnswer = (question.data?.correctAnswer || '').toLowerCase().trim();
    const studentAnswerClean = (studentAnswer || '').toLowerCase().trim();

    // Check for exact match or keyword match
    const isExactMatch = studentAnswerClean === correctAnswer;
    const containsKeyword = correctAnswer && studentAnswerClean.includes(correctAnswer);

    const isCorrect = isExactMatch || containsKeyword;

    return {
        isCorrect,
        score: isCorrect ? maxPoints : 0,
        feedback: isCorrect ? 'Correct!' : 'Incorrect. Please review the expected answer.',
        requiresManualReview: !isExactMatch // Flag for instructor review
    };
}

// 5. ESSAY - Requires manual grading
function gradeEssay(question, studentAnswer, maxPoints) {
    return {
        isCorrect: null, // Cannot auto-grade
        score: 0, // Default to 0 until manual grading
        feedback: 'This answer requires manual grading by the instructor.',
        requiresManualReview: true
    };
}

// 6. NUMERICAL - Number with tolerance
function gradeNumerical(question, studentAnswer, maxPoints) {
    const correctAnswer = parseFloat(question.data?.correctAnswer);
    const tolerance = parseFloat(question.data?.tolerance || 0);
    const studentValue = parseFloat(studentAnswer);

    if (isNaN(correctAnswer) || isNaN(studentValue)) {
        return {
            isCorrect: false,
            score: 0,
            feedback: 'Invalid number entered.'
        };
    }

    const difference = Math.abs(studentValue - correctAnswer);
    const isCorrect = difference <= tolerance;

    return {
        isCorrect,
        score: isCorrect ? maxPoints : 0,
        feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer was ${correctAnswer} (±${tolerance})`
    };
}

// 7. MATCHING - Pairs matching
function gradeMatching(question, studentAnswer, maxPoints) {
    const correctPairs = question.data?.pairs || [];
    const studentPairs = studentAnswer || [];

    if (correctPairs.length !== studentPairs.length) {
        return {
            isCorrect: false,
            score: 0,
            feedback: 'Number of matches is incorrect.'
        };
    }

    // Count correct matches
    let correctMatches = 0;
    for (let i = 0; i < correctPairs.length; i++) {
        if (correctPairs[i].left === studentPairs[i].left &&
            correctPairs[i].right === studentPairs[i].right) {
            correctMatches++;
        }
    }

    const isFullyCorrect = correctMatches === correctPairs.length;
    const partialScore = (correctMatches / correctPairs.length) * maxPoints;

    return {
        isCorrect: isFullyCorrect,
        score: partialScore,
        feedback: isFullyCorrect ? 'Correct!' : `You got ${correctMatches} out of ${correctPairs.length} matches correct.`
    };
}

// 8. FILL IN THE BLANK
function gradeFillBlank(question, studentAnswer, maxPoints) {
    const correctAnswer = (question.data?.correctAnswer || '').toLowerCase().trim();
    const studentAnswerClean = (studentAnswer || '').toLowerCase().trim();

    const isCorrect = studentAnswerClean === correctAnswer;

    return {
        isCorrect,
        score: isCorrect ? maxPoints : 0,
        feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer was: "${question.data?.correctAnswer}"`
    };
}

// 9. ORDERING - Sequence check
function gradeOrdering(question, studentAnswer, maxPoints) {
    const correctOrder = question.data?.items || [];
    const studentOrder = studentAnswer || [];

    const isCorrect = JSON.stringify(correctOrder) === JSON.stringify(studentOrder);

    return {
        isCorrect,
        score: isCorrect ? maxPoints : 0,
        feedback: isCorrect ? 'Correct!' : 'The order is incorrect.'
    };
}

// 10. DROPDOWN - Selection check
function gradeDropdown(question, studentAnswer, maxPoints) {
    const correctIndex = question.data?.correctAnswer;
    const isCorrect = studentAnswer === correctIndex;

    return {
        isCorrect,
        score: isCorrect ? maxPoints : 0,
        feedback: isCorrect ? 'Correct!' : 'Incorrect selection.'
    };
}

// 11. YES/NO
function gradeYesNo(question, studentAnswer, maxPoints) {
    const correctAnswer = question.data?.correctAnswer;
    const isCorrect = studentAnswer === correctAnswer;

    return {
        isCorrect,
        score: isCorrect ? maxPoints : 0,
        feedback: isCorrect ? 'Correct!' : `Incorrect. Correct answer was: ${correctAnswer}`
    };
}

// 12. RATING SCALE - Usually feedback, auto-pass
function gradeRatingScale(question, studentAnswer, maxPoints) {
    // Rating scales are typically for feedback, not grading
    // Auto-pass with full points
    return {
        isCorrect: true,
        score: maxPoints,
        feedback: 'Thank you for your rating!'
    };
}

// 13. LIKERT SCALE - Can be graded or feedback
function gradeLikertScale(question, studentAnswer, maxPoints) {
    // Likert scales can be used for agreement assessment
    // For simplicity, auto-pass (can be customized)
    return {
        isCorrect: true,
        score: maxPoints,
        feedback: 'Thank you for your response!',
        requiresManualReview: false
    };
}

// 14. CHECKLIST - Check selected items
function gradeChecklist(question, studentAnswer, maxPoints) {
    const correctItems = question.data?.correctItems || [];
    const studentItems = Array.isArray(studentAnswer) ? studentAnswer : [];

    const sortedCorrect = [...correctItems].sort();
    const sortedStudent = [...studentItems].sort();
    const isCorrect = JSON.stringify(sortedCorrect) === JSON.stringify(sortedStudent);

    return {
        isCorrect,
        score: isCorrect ? maxPoints : 0,
        feedback: isCorrect ? 'Correct!' : 'Some selections are incorrect.'
    };
}

// 15. GRID/MATRIX - Row-by-row check
function gradeGrid(question, studentAnswer, maxPoints) {
    // Grid questions usually require manual review
    // Or can have predefined correct answers per row
    return {
        isCorrect: null,
        score: 0,
        feedback: 'This grid question requires manual grading.',
        requiresManualReview: true
    };
}

/**
 * Grade an entire quiz
 * @param {Array} questions - Array of question objects
 * @param {Object} studentAnswers - Object with questionId as key and answer as value
 * @returns {Object} { totalScore, maxScore, percentage, results }
 */
export function gradeQuiz(questions, studentAnswers) {
    let totalScore = 0;
    let maxScore = 0;
    const results = [];

    questions.forEach((question, index) => {
        const questionId = question.id || index;
        const studentAnswer = studentAnswers[questionId];
        const maxPoints = question.points || 1;

        maxScore += maxPoints;

        const result = gradeQuestion(question, studentAnswer);
        totalScore += result.score;

        results.push({
            questionId,
            questionText: question.content,
            studentAnswer,
            ...result
        });
    });

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    return {
        totalScore,
        maxScore,
        percentage: Math.round(percentage * 100) / 100,
        passed: percentage >= 60, // Default passing grade
        results,
        requiresManualReview: results.some(r => r.requiresManualReview)
    };
}

export default {
    gradeQuestion,
    gradeQuiz
};
