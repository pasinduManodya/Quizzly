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
  userName?: string;
  userEmail?: string;
}

export const generateQuizPDF = async (quizResult: QuizResult): Promise<void> => {
  const { document } = quizResult;
  
  // Create new PDF document
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;
  let pageNumber = 1;
  
  // Load logo image
  let logoDataUrl: string | null = null;
  try {
    const response = await fetch('/Logo_Full.png');
    const blob = await response.blob();
    logoDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load logo:', error);
  }
  
  // Helper function to add Quizzly header
  const addPageHeader = () => {
    if (logoDataUrl) {
      // Add logo image centered at top, maintaining aspect ratio
      const logoHeight = 10;
      const logoX = (pageWidth - 40) / 2;
      pdf.addImage(logoDataUrl, 'PNG', logoX, 6, 0, logoHeight, undefined, 'FAST');
    } else {
      // Fallback to text if logo fails to load
      pdf.setFontSize(10);
      pdf.setFont('times', 'bold');
      pdf.setTextColor(40, 40, 40);
      pdf.text('QUIZZLY', pageWidth / 2, 12, { align: 'center' });
      
      pdf.setFontSize(7);
      pdf.setFont('times', 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Beat Your Best', pageWidth / 2, 16, { align: 'center' });
    }
    
    // Horizontal line
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.line(margin, 18, pageWidth - margin, 18);
  };
  
  // Helper function to add footer with "Powered by Quizzly"
  const addPageFooter = () => {
    const footerY = pageHeight - 10;
    
    // Horizontal line above footer
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    // Quizzly branding
    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 80);
    pdf.setFont('times', 'bold');
    pdf.text('Powered by QUIZZLY', pageWidth / 2, footerY, { align: 'center' });
    
    // Page number
    pdf.setFont('times', 'normal');
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Page ${pageNumber}`, pageWidth - margin, footerY, { align: 'right' });
  };
  
  // Helper function to check page break
  const checkPageBreak = (requiredSpace: number = 15) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      addPageFooter();
      pdf.addPage();
      pageNumber++;
      addPageHeader();
      yPosition = 25;
      return true;
    }
    return false;
  };
  
  // Helper function to add wrapped text
  const addWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number = 11,
    fontStyle: string = 'normal',
    lineSpacing: number = 1.3
  ): number => {
    pdf.setFontSize(fontSize);
    pdf.setFont('times', fontStyle);
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    lines.forEach((line: string, index: number) => {
      pdf.text(line, x, y + (index * fontSize * 0.35 * lineSpacing));
    });
    
    return y + (lines.length * fontSize * 0.35 * lineSpacing);
  };
  
  // ==================== TITLE SECTION (First Page - No Header) ====================
  pdf.setFontSize(16);
  pdf.setFont('times', 'bold');
  pdf.setTextColor(0, 0, 0);
  
  // Center the title
  const titleLines = pdf.splitTextToSize(document.title, contentWidth);
  titleLines.forEach((line: string, index: number) => {
    pdf.text(line, pageWidth / 2, yPosition + (index * 6), { align: 'center' });
  });
  
  yPosition += titleLines.length * 6 + 10;
  
  // Add a horizontal line under title
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  
  yPosition += 10;
  
  // ==================== QUESTIONS SECTION ====================
  document.questions.forEach((question, index) => {
    // Estimate space needed for question
    const estimatedSpace = question.type === 'mcq' && question.options 
      ? 30 + (question.options.length * 8)
      : 40;
    
    checkPageBreak(estimatedSpace);
    
    // Question number and text
    pdf.setFontSize(11);
    pdf.setFont('times', 'bold');
    pdf.setTextColor(0, 0, 0);
    
    const questionNumber = `${index + 1}.`;
    pdf.text(questionNumber, margin, yPosition);
    
    // Question text
    pdf.setFont('times', 'normal');
    yPosition = addWrappedText(
      question.question,
      margin + 10,
      yPosition,
      contentWidth - 10,
      11,
      'normal',
      1.4
    );
    
    yPosition += 5;
    
    // Options for MCQ
    if (question.type === 'mcq' && question.options) {
      question.options.forEach((option, optionIndex) => {
        checkPageBreak(10);
        
        const optionLetter = String.fromCharCode(65 + optionIndex);
        pdf.setFontSize(11);
        pdf.setFont('times', 'normal');
        
        // Option letter
        pdf.text(`${optionLetter}.`, margin + 15, yPosition);
        
        // Option text
        yPosition = addWrappedText(
          option,
          margin + 23,
          yPosition,
          contentWidth - 23,
          11,
          'normal',
          1.3
        );
        
        yPosition += 4;
      });
      
      yPosition += 5;
    } else {
      // Answer space for essay/short questions
      checkPageBreak(25);
      
      pdf.setFontSize(10);
      pdf.setFont('times', 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Answer:', margin + 15, yPosition);
      
      yPosition += 6;
      
      // Draw answer lines
      for (let i = 0; i < 4; i++) {
        checkPageBreak(8);
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(margin + 15, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;
      }
      
      yPosition += 5;
    }
    
    yPosition += 3;
  });
  
  // Add footer to last page
  addPageFooter();
  
  // Download the PDF
  const fileName = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}_Exam.pdf`;
  pdf.save(fileName);
};

export default generateQuizPDF;
