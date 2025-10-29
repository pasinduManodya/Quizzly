import jsPDF from 'jspdf';

interface Question {
  _id: string;
  type: 'mcq' | 'short' | 'essay' | 'structured_essay';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface Document {
  _id: string;
  title: string;
  questions: Question[];
}

interface QuizResult {
  document: Document;
  answers: string[];
  total: number;
  correct: number;
  incorrect: number;
  quizDuration: number;
}

export const generateQuizPDF = (quizResult: QuizResult): void => {
  const { document, answers, total, correct, incorrect, quizDuration } = quizResult;
  
  // Create new PDF document
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Colors
  const primaryColor = [59, 130, 246]; // Blue
  const successColor = [34, 197, 94]; // Green
  const grayColor = [107, 114, 128]; // Gray
  
  let yPosition = 20;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  
  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number = 10) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };
  
  // Helper function to add text with word wrapping
  const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10, color: number[] = [0, 0, 0]) => {
    pdf.setFontSize(fontSize);
    pdf.setTextColor(color[0], color[1], color[2]);
    
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.4);
  };
  
  // Questions and Answers Section
  document.questions.forEach((question, index) => {
    checkPageBreak(30);
    
    // Question Header
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Question ${index + 1}`, margin + 5, yPosition + 5);
    
    // Question Type Badge
    const typeText = question.type === 'mcq' ? 'Multiple Choice' : 'Short Answer';
    const typeWidth = pdf.getTextWidth(typeText) + 10;
    pdf.setFillColor(grayColor[0], grayColor[1], grayColor[2]);
    pdf.rect(pageWidth - margin - typeWidth, yPosition, typeWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text(typeText, pageWidth - margin - typeWidth + 5, yPosition + 5);
    
    yPosition += 15;
    
    // Question Text
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(question.question, margin, yPosition, contentWidth, 11);
    
    yPosition += 5;
    
    // Options (for MCQ)
    if (question.type === 'mcq' && question.options) {
      pdf.setFontSize(10);
      pdf.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Options:', margin, yPosition);
      yPosition += 8;
      
      question.options.forEach((option, optionIndex) => {
        const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        yPosition = addWrappedText(`${optionLetter}. ${option}`, margin + 10, yPosition, contentWidth - 10, 10);
      });
      
      yPosition += 5;
    }
    
    // Correct Answer (Highlighted)
    pdf.setFontSize(10);
    pdf.setTextColor(successColor[0], successColor[1], successColor[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Correct Answer:', margin, yPosition);
    yPosition += 6;
    
    pdf.setFontSize(10);
    pdf.setTextColor(successColor[0], successColor[1], successColor[2]);
    pdf.setFont('helvetica', 'bold');
    yPosition = addWrappedText(question.correctAnswer, margin + 10, yPosition, contentWidth - 10, 10, successColor);
    
    yPosition += 10;
    
    // Add separator line between questions
    if (index < document.questions.length - 1) {
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;
    }
  });
  
  // Download the PDF
  const fileName = `Quiz_${document.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

export default generateQuizPDF;
