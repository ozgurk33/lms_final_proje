import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateQuizResultPDF = (quiz, result, user) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Quiz Result Certificate', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(quiz?.title || 'Quiz', 105, 30, { align: 'center' });

    // Student Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Student Information', 20, 55);

    doc.setFontSize(11);
    doc.text(`Name: ${user?.fullName || user?.username}`, 20, 65);
    doc.text(`Email: ${user?.email}`, 20, 72);
    doc.text(`Date: ${new Date(result?.completedAt).toLocaleDateString()}`, 20, 79);

    // Results
    doc.setFontSize(14);
    doc.text('Quiz Results', 20, 95);

    // Results table
    const tableData = [
        ['Score', `${result?.score?.toFixed(1)}%`],
        ['Status', result?.isPassed ? 'PASSED ✓' : 'FAILED ✗'],
        ['Passing Score', `${quiz?.passingScore || 60}%`],
        ['Duration', `${quiz?.duration || 0} minutes`]
    ];

    doc.autoTable({
        startY: 100,
        head: [['Metric', 'Value']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [102, 126, 234] },
        styles: { fontSize: 11 }
    });

    // Performance badge
    const finalY = doc.lastAutoTable.finalY + 20;

    if (result?.isPassed) {
        doc.setFillColor(76, 175, 80);
        doc.circle(105, finalY + 15, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text('PASSED', 105, finalY + 18, { align: 'center' });
    } else {
        doc.setFillColor(244, 67, 54);
        doc.circle(105, finalY + 15, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text('FAILED', 105, finalY + 18, { align: 'center' });
    }

    // Footer
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(9);
    doc.text('LMS - Learning Management System', 105, 280, { align: 'center' });
    doc.text('This is an automatically generated certificate', 105, 285, { align: 'center' });

    // Save
    const fileName = `quiz_result_${quiz?.title?.replace(/\s/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
};

export const generateCertificatePDF = (course, user, completionDate) => {
    const doc = new jsPDF({
        orientation: 'landscape'
    });

    // Decorative border
    doc.setLineWidth(2);
    doc.setDrawColor(102, 126, 234);
    doc.rect(10, 10, 277, 190);

    doc.setLineWidth(0.5);
    doc.setDrawColor(102, 126, 234);
    doc.rect(15, 15, 267, 180);

    // Header
    doc.setFontSize(32);
    doc.setTextColor(102, 126, 234);
    doc.text('Certificate of Completion', 148.5, 50, { align: 'center' });

    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('This is to certify that', 148.5, 70, { align: 'center' });

    // Student name
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text(user?.fullName || user?.username, 148.5, 90, { align: 'center' });

    // Course info
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('has successfully completed the course', 148.5, 105, { align: 'center' });

    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text(course?.title || 'Course', 148.5, 125, { align: 'center' });

    // Date
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Completion Date: ${new Date(completionDate).toLocaleDateString()}`, 148.5, 145, { align: 'center' });

    // Signature line
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(60, 175, 110, 175);
    doc.line(187, 175, 237, 175);

    doc.setFontSize(10);
    doc.text('Instructor Signature', 85, 182, { align: 'center' });
    doc.text('Date', 212, 182, { align: 'center' });

    // Save
    const fileName = `certificate_${course?.title?.replace(/\s/g, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
};
