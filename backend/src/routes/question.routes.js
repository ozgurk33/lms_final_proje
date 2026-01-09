import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireMinRole } from '../middleware/rbac.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data file paths
const DATA_DIR = path.join(__dirname, '../../data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questionBank.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const TAGS_FILE = path.join(DATA_DIR, 'tags.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data from files or initialize with defaults
function loadData(filePath, defaultData) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
    }
    return defaultData;
}

// Save data to file
function saveData(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`Error saving ${filePath}:`, error);
        return false;
    }
}

// Initialize data from files
let questionBank = loadData(QUESTIONS_FILE, [
    {
        id: '1',
        content: 'What is 2 + 2?',
        type: 'multiple_choice',
        category: 'Math',
        tags: ['easy', 'arithmetic'],
        points: 10,
        data: {
            options: ['2', '3', '4', '5'],
            correctAnswer: 2
        },
        createdBy: 'system',
        createdAt: new Date().toISOString()
    }
]);

let categories = loadData(CATEGORIES_FILE, ['General', 'Math', 'Science', 'Programming', 'History', 'Languages']);
let tags = loadData(TAGS_FILE, ['easy', 'medium', 'hard', 'review', 'important', 'bonus']);

// Save initial data if files don't exist
if (!fs.existsSync(QUESTIONS_FILE)) saveData(QUESTIONS_FILE, questionBank);
if (!fs.existsSync(CATEGORIES_FILE)) saveData(CATEGORIES_FILE, categories);
if (!fs.existsSync(TAGS_FILE)) saveData(TAGS_FILE, tags);

console.log('📁 Question Bank loaded:', questionBank.length, 'questions');

/**
 * @route GET /api/questions/bank
 * @desc Get question bank with filtering
 * @access Instructor, Admin
 */
router.get('/bank', authenticate, requireMinRole('INSTRUCTOR'), async (req, res) => {
    try {
        // Reload from file to get latest data
        questionBank = loadData(QUESTIONS_FILE, questionBank);

        const { category, tags: filterTags, search } = req.query;

        let filteredQuestions = [...questionBank];

        // Filter by category
        if (category) {
            filteredQuestions = filteredQuestions.filter(q =>
                q.category?.toLowerCase() === category.toLowerCase()
            );
        }

        // Filter by tags
        if (filterTags) {
            const tagsArray = Array.isArray(filterTags) ? filterTags : [filterTags];
            filteredQuestions = filteredQuestions.filter(q =>
                q.tags?.some(tag => tagsArray.includes(tag))
            );
        }

        // Search in content
        if (search) {
            const searchLower = search.toLowerCase();
            filteredQuestions = filteredQuestions.filter(q =>
                q.content?.toLowerCase().includes(searchLower)
            );
        }

        res.json({
            questions: filteredQuestions,
            total: filteredQuestions.length
        });
    } catch (error) {
        console.error('Get question bank error:', error);
        res.status(500).json({ error: 'Failed to fetch question bank' });
    }
});

/**
 * @route POST /api/questions
 * @desc Create new question
 * @access Instructor, Admin
 */
router.post('/', authenticate, requireMinRole('INSTRUCTOR'), async (req, res) => {
    try {
        const questionData = req.body;

        // Validate required fields
        if (!questionData.content || !questionData.type) {
            return res.status(400).json({ error: 'Content and type are required' });
        }

        // Reload to get latest
        questionBank = loadData(QUESTIONS_FILE, questionBank);

        const newQuestion = {
            id: Date.now().toString(),
            content: questionData.content,
            type: questionData.type,
            category: questionData.category || 'General',
            tags: questionData.tags || [],
            points: questionData.points || 10,
            data: questionData.data || {},
            createdBy: req.user.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add to question bank
        questionBank.push(newQuestion);

        // Save to file
        if (saveData(QUESTIONS_FILE, questionBank)) {
            console.log('✅ Question created and saved:', newQuestion.id, newQuestion.content);
            console.log('📊 Total questions in bank:', questionBank.length);
            res.status(201).json(newQuestion);
        } else {
            res.status(500).json({ error: 'Failed to save question' });
        }
    } catch (error) {
        console.error('Create question error:', error);
        res.status(500).json({ error: 'Failed to create question' });
    }
});

/**
 * @route GET /api/questions/categories
 * @desc Get all question categories
 * @access Instructor, Admin
 */
router.get('/categories', authenticate, requireMinRole('INSTRUCTOR'), async (req, res) => {
    try {
        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

/**
 * @route POST /api/questions/categories
 * @desc Create new category
 * @access Instructor, Admin
 */
router.post('/categories', authenticate, requireMinRole('INSTRUCTOR'), async (req, res) => {
    try {
        const { name } = req.body;

        categories = loadData(CATEGORIES_FILE, categories);

        if (!name || categories.includes(name)) {
            return res.status(400).json({ error: 'Invalid or duplicate category' });
        }

        categories.push(name);
        saveData(CATEGORIES_FILE, categories);
        res.status(201).json({ message: 'Category created', name, categories });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

/**
 * @route GET /api/questions/tags
 * @desc Get all question tags
 * @access Instructor, Admin
 */
router.get('/tags', authenticate, requireMinRole('INSTRUCTOR'), async (req, res) => {
    try {
        res.json({ tags });
    } catch (error) {
        console.error('Get tags error:', error);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
});

/**
 * @route POST /api/questions/:id/rubric
 * @desc Save rubric for a question
 * @access Instructor, Admin
 */
router.post('/:id/rubric', authenticate, requireMinRole('INSTRUCTOR'), async (req, res) => {
    try {
        const { id } = req.params;
        const rubric = req.body;

        const question = questionBank.find(q => q.id === id);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        question.data = question.data || {};
        question.data.rubric = rubric;

        res.json({ message: 'Rubric saved successfully', questionId: id, rubric });
    } catch (error) {
        console.error('Save rubric error:', error);
        res.status(500).json({ error: 'Failed to save rubric' });
    }
});

/**
 * @route GET /api/questions/:id/rubric
 * @desc Get rubric for a question
 * @access Instructor, Admin, Student
 */
router.get('/:id/rubric', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const question = questionBank.find(q => q.id === id);
        if (!question || !question.data?.rubric) {
            // Return default rubric
            const mockRubric = {
                criteria: [
                    {
                        name: 'Content Quality',
                        weight: 40,
                        levels: [
                            { score: 10, label: 'Excellent', description: 'Outstanding work' },
                            { score: 7, label: 'Good', description: 'Good quality' },
                            { score: 4, label: 'Fair', description: 'Acceptable' },
                            { score: 0, label: 'Poor', description: 'Needs improvement' }
                        ]
                    }
                ],
                totalPoints: 40
            };
            return res.json(mockRubric);
        }

        res.json(question.data.rubric);
    } catch (error) {
        console.error('Get rubric error:', error);
        res.status(500).json({ error: 'Failed to fetch rubric' });
    }
});

/**
 * @route PUT /api/questions/:id
 * @desc Update question
 * @access Instructor, Admin
 */
router.put('/:id', authenticate, requireMinRole('INSTRUCTOR'), async (req, res) => {
    try {
        const { id } = req.params;
        const questionData = req.body;

        questionBank = loadData(QUESTIONS_FILE, questionBank);

        const questionIndex = questionBank.findIndex(q => q.id === id);
        if (questionIndex === -1) {
            return res.status(404).json({ error: 'Question not found' });
        }

        questionBank[questionIndex] = {
            ...questionBank[questionIndex],
            ...questionData,
            id, // Preserve ID
            updatedAt: new Date().toISOString()
        };

        saveData(QUESTIONS_FILE, questionBank);
        console.log('✅ Question updated:', id);
        res.json({ message: 'Question updated', question: questionBank[questionIndex] });
    } catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({ error: 'Failed to update question' });
    }
});

/**
 * @route DELETE /api/questions/:id
 * @desc Delete question
 * @access Instructor, Admin
 */
router.delete('/:id', authenticate, requireMinRole('INSTRUCTOR'), async (req, res) => {
    try {
        const { id } = req.params;

        questionBank = loadData(QUESTIONS_FILE, questionBank);

        const questionIndex = questionBank.findIndex(q => q.id === id);
        if (questionIndex === -1) {
            return res.status(404).json({ error: 'Question not found' });
        }

        questionBank.splice(questionIndex, 1);
        saveData(QUESTIONS_FILE, questionBank);

        console.log('🗑️ Question deleted:', id);
        console.log('📊 Total questions in bank:', questionBank.length);

        res.json({ message: 'Question deleted', id });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

export default router;

