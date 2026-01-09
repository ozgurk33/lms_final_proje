// Question type constants for quiz builder - 15 SIMPLE TYPES
export const QUESTION_TYPES = {
    MULTIPLE_CHOICE: 'multiple_choice',      // 1. Tek seçim (4 şık)
    MULTIPLE_SELECT: 'multiple_select',      // 2. Çoklu seçim (4+ şık)
    TRUE_FALSE: 'true_false',                // 3. Doğru/Yanlış
    SHORT_ANSWER: 'short_answer',            // 4. Kısa cevap (text)
    ESSAY: 'essay',                          // 5. Uzun cevap (textarea)
    NUMERICAL: 'numerical',                  // 6. Sayısal cevap
    MATCHING: 'matching',                    // 7. Eşleştirme
    FILL_BLANK: 'fill_blank',                // 8. Boşluk doldurma
    ORDERING: 'ordering',                    // 9. Sıralama
    DROPDOWN: 'dropdown',                    // 10. Açılır liste
    YES_NO: 'yes_no',                        // 11. Evet/Hayır
    RATING_SCALE: 'rating_scale',            // 12. Derecelendirme (1-5)
    LIKERT_SCALE: 'likert_scale',            // 13. Likert (Kesinlikle Katılıyorum...Katılmıyorum)
    CHECKLIST: 'checklist',                  // 14. Kontrol listesi
    GRID: 'grid'                             // 15. Tablo/Grid
};

export const QUESTION_TYPE_LABELS = {
    [QUESTION_TYPES.MULTIPLE_CHOICE]: 'Multiple Choice (Single Answer)',
    [QUESTION_TYPES.MULTIPLE_SELECT]: 'Multiple Select (Multiple Answers)',
    [QUESTION_TYPES.TRUE_FALSE]: 'True/False',
    [QUESTION_TYPES.SHORT_ANSWER]: 'Short Answer',
    [QUESTION_TYPES.ESSAY]: 'Essay',
    [QUESTION_TYPES.NUMERICAL]: 'Numerical Answer',
    [QUESTION_TYPES.MATCHING]: 'Matching',
    [QUESTION_TYPES.FILL_BLANK]: 'Fill in the Blank',
    [QUESTION_TYPES.ORDERING]: 'Ordering/Sequencing',
    [QUESTION_TYPES.DROPDOWN]: 'Dropdown Select',
    [QUESTION_TYPES.YES_NO]: 'Yes/No',
    [QUESTION_TYPES.RATING_SCALE]: 'Rating Scale (1-5)',
    [QUESTION_TYPES.LIKERT_SCALE]: 'Likert Scale',
    [QUESTION_TYPES.CHECKLIST]: 'Checklist',
    [QUESTION_TYPES.GRID]: 'Grid/Matrix'
};

export const QUESTION_TYPE_DESCRIPTIONS = {
    [QUESTION_TYPES.MULTIPLE_CHOICE]: 'Student selects ONE correct answer from 4 options',
    [QUESTION_TYPES.MULTIPLE_SELECT]: 'Student can select MULTIPLE correct answers',
    [QUESTION_TYPES.TRUE_FALSE]: 'Student chooses True or False',
    [QUESTION_TYPES.SHORT_ANSWER]: 'Student types a short text response (1-2 sentences)',
    [QUESTION_TYPES.ESSAY]: 'Student writes a detailed answer (paragraph)',
    [QUESTION_TYPES.NUMERICAL]: 'Student enters a number as answer',
    [QUESTION_TYPES.MATCHING]: 'Student matches items from two columns',
    [QUESTION_TYPES.FILL_BLANK]: 'Student fills in missing word(s) in a sentence',
    [QUESTION_TYPES.ORDERING]: 'Student arranges items in correct order',
    [QUESTION_TYPES.DROPDOWN]: 'Student selects answer from dropdown menu',
    [QUESTION_TYPES.YES_NO]: 'Student chooses Yes or No',
    [QUESTION_TYPES.RATING_SCALE]: 'Student rates on scale of 1-5',
    [QUESTION_TYPES.LIKERT_SCALE]: 'Student chooses from Strongly Agree to Strongly Disagree',
    [QUESTION_TYPES.CHECKLIST]: 'Student checks items that apply',
    [QUESTION_TYPES.GRID]: 'Multiple questions in table format'
};

export const AUTO_GRADABLE_TYPES = [
    QUESTION_TYPES.MULTIPLE_CHOICE,
    QUESTION_TYPES.MULTIPLE_SELECT,
    QUESTION_TYPES.TRUE_FALSE,
    QUESTION_TYPES.NUMERICAL,
    QUESTION_TYPES.MATCHING,
    QUESTION_TYPES.FILL_BLANK,
    QUESTION_TYPES.ORDERING,
    QUESTION_TYPES.DROPDOWN,
    QUESTION_TYPES.YES_NO,
    QUESTION_TYPES.RATING_SCALE,
    QUESTION_TYPES.CHECKLIST
];

export const MANUAL_GRADING_TYPES = [
    QUESTION_TYPES.SHORT_ANSWER,
    QUESTION_TYPES.ESSAY,
    QUESTION_TYPES.LIKERT_SCALE,
    QUESTION_TYPES.GRID
];
