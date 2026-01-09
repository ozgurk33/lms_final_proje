/**
 * Mock OMR Storage - In-Memory Database
 * NO DATABASE CHANGES REQUIRED FOR TESTING!
 */

class MockOMRStorage {
    constructor() {
        this.sheets = [];
        this.results = [];
    }

    // OMRSheet Methods
    createSheet(data) {
        const sheet = {
            id: `mock-sheet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            instructorId: data.instructorId,
            studentId: data.studentId || null,
            courseId: data.courseId || null,
            quizId: data.quizId || null,
            imageUrl: data.imageUrl,
            rawData: data.rawData || null,
            status: data.status || 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date(),
            instructor: data.instructor || null,
            student: data.student || null,
            course: data.course || null,
            quiz: data.quiz || null,
            result: null
        };

        this.sheets.push(sheet);
        return sheet;
    }

    findSheetById(id) {
        const sheet = this.sheets.find(s => s.id === id);
        if (sheet) {
            // Add result if exists
            sheet.result = this.results.find(r => r.sheetId === id) || null;
        }
        return sheet || null;
    }

    findSheetsByInstructor(instructorId, filters = {}) {
        let filtered = this.sheets.filter(s => s.instructorId === instructorId);

        if (filters.status) {
            filtered = filtered.filter(s => s.status === filters.status);
        }
        if (filters.courseId) {
            filtered = filtered.filter(s => s.courseId === filters.courseId);
        }
        if (filters.quizId) {
            filtered = filtered.filter(s => s.quizId === filters.quizId);
        }

        // Add results
        filtered = filtered.map(sheet => ({
            ...sheet,
            result: this.results.find(r => r.sheetId === sheet.id) || null
        }));

        return filtered;
    }

    updateSheet(id, data) {
        const index = this.sheets.findIndex(s => s.id === id);
        if (index === -1) return null;

        this.sheets[index] = {
            ...this.sheets[index],
            ...data,
            updatedAt: new Date()
        };

        return this.sheets[index];
    }

    deleteSheet(id) {
        const index = this.sheets.findIndex(s => s.id === id);
        if (index === -1) return false;

        this.sheets.splice(index, 1);
        // Also delete associated result
        const resultIndex = this.results.findIndex(r => r.sheetId === id);
        if (resultIndex !== -1) {
            this.results.splice(resultIndex, 1);
        }

        return true;
    }

    // OMRResult Methods
    createResult(data) {
        const result = {
            id: `mock-result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sheetId: data.sheetId,
            answers: data.answers,
            confidence: data.confidence || null,
            testId: data.testId || null,
            rollNo: data.rollNo || null,
            validated: data.validated || false,
            validatedBy: data.validatedBy || null,
            validatedAt: data.validatedAt || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            sheet: null
        };

        this.results.push(result);
        return result;
    }

    findResultBySheetId(sheetId) {
        const result = this.results.find(r => r.sheetId === sheetId);
        if (result) {
            // Add sheet info
            result.sheet = this.sheets.find(s => s.id === sheetId) || null;
        }
        return result || null;
    }

    findResultById(id) {
        return this.results.find(r => r.id === id) || null;
    }

    updateResult(id, data) {
        const index = this.results.findIndex(r => r.id === id);
        if (index === -1) return null;

        this.results[index] = {
            ...this.results[index],
            ...data,
            updatedAt: new Date()
        };

        return this.results[index];
    }

    // Utility Methods
    reset() {
        this.sheets = [];
        this.results = [];
    }

    getStats() {
        return {
            totalSheets: this.sheets.length,
            totalResults: this.results.length,
            sheetsByStatus: {
                PENDING: this.sheets.filter(s => s.status === 'PENDING').length,
                PROCESSING: this.sheets.filter(s => s.status === 'PROCESSING').length,
                COMPLETED: this.sheets.filter(s => s.status === 'COMPLETED').length,
                VALIDATION: this.sheets.filter(s => s.status === 'VALIDATION').length,
                SUBMITTED: this.sheets.filter(s => s.status === 'SUBMITTED').length,
                FAILED: this.sheets.filter(s => s.status === 'FAILED').length,
            }
        };
    }
}

// Singleton instance
const mockOMRStorage = new MockOMRStorage();

module.exports = mockOMRStorage;
