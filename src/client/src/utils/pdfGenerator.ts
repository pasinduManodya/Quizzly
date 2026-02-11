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

export const generateQuizPDF = (quizResult: QuizResult): void => {
  const { document, answers, total, correct, incorrect, quizDuration, userName, userEmail } = quizResult;
  
  // Create new PDF document
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Modern color palette
  const colors = {
    primary: [59, 130, 246],      // Blue
    primaryDark: [37, 99, 235],    // Darker Blue
    success: [16, 185, 129],       // Green
    danger: [239, 68, 68],         // Red
    warning: [245, 158, 11],       // Orange
    gray: [107, 114, 128],         // Gray
    lightGray: [243, 244, 246],    // Light Gray
    darkGray: [55, 65, 81],        // Dark Gray
    white: [255, 255, 255],
    black: [17, 24, 39]            // Almost Black
  };
  
  let yPosition = 20;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let pageNumber = 1;
  
  // Helper function to add header to each page
  const addPageHeader = () => {
    // Add subtle background gradient effect (simulated with rectangles)
    pdf.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    // Add logo (if available)
    try {
      const logoImg = new Image();
      logoImg.src = '/logo.jpg';
      pdf.addImage(logoImg, 'JPEG', margin, 10, 15, 15);
    } catch (error) {
      // If logo fails, add text logo
      pdf.setFontSize(16);
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Q', margin, 20);
    }
    
    // Add "Quizzly" branding
    pdf.setFontSize(14);
    pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Quizzly', margin + 20, 20);
    
    // Add page number on the right
    pdf.setFontSize(9);
    pdf.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Page ${pageNumber}`, pageWidth - margin - 15, 20);
  };
  
  // Helper function to add footer to each page
  const addPageFooter = () => {
    const footerY = pageHeight - 10;
    pdf.setFontSize(8);
    pdf.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    pdf.setFont('helvetica', 'normal');
    
    // Generated date/time
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    pdf.text(`Generated on ${dateStr} at ${timeStr}`, margin, footerY);
    pdf.text('© Quizzly - Quiz Results Report', pageWidth - margin - 60, footerY);
  };
  
  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number = 10) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      addPageFooter();
      pdf.addPage();
      pageNumber++;
      addPageHeader();
      yPosition = 45;
      return true;
    }
    return false;
  };
  
  // Helper function to add text with word wrapping and proper line height
  const addWrappedText = (
    text: string, 
    x: number, 
    y: number, 
    maxWidth: number, 
    fontSize: number = 10, 
    color: number[] = colors.black,
    lineHeight: number = 1.5
  ) => {
    pdf.setFontSize(fontSize);
    pdf.setTextColor(color[0], color[1], color[2]);
    
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.35 * lineHeight);
  };
  
  // Add first page header
  addPageHeader();
  yPosition = 45;
  
  // ==================== TITLE SECTION ====================
  // Title background
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.roundedRect(margin, yPosition, contentWidth, 25, 3, 3, 'F');
  
  // Quiz title
  pdf.setFontSize(18);
  pdf.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(document.title, contentWidth - 20);
  pdf.text(titleLines, margin + 10, yPosition + 10);
  
  // Subtitle
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Quiz Results Report', margin + 10, yPosition + 20);
  
  yPosition += 35;
  
  // ==================== USER INFO & METADATA SECTION ====================
  // Info card background
  pdf.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  pdf.roundedRect(margin, yPosition, contentWidth, 28, 2, 2, 'F');
  
  // User information
  pdf.setFontSize(10);
  pdf.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
  pdf.setFont('helvetica', 'bold');
  
  let infoY = yPosition + 8;
  
  // User name
  if (userName) {
    pdf.text('Student:', margin + 5, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(userName, margin + 25, infoY);
    infoY += 6;
  }
  
  // User email
  if (userEmail) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Email:', margin + 5, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(userEmail, margin + 25, infoY);
    infoY += 6;
  }
  
  // Date and time
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Date:', margin + 5, infoY);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${dateStr} at ${timeStr}`, margin + 25, infoY);
  
  yPosition += 38;
  
  // ==================== SCORE SUMMARY SECTION ====================
  checkPageBreak(35);
  
  // Score cards container
  const cardWidth = (contentWidth - 10) / 3;
  const cardHeight = 25;
  
  // Total Questions Card
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.roundedRect(margin, yPosition, cardWidth, cardHeight, 2, 2, 'F');
  pdf.setFontSize(24);
  pdf.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text(total.toString(), margin + cardWidth / 2, yPosition + 12, { align: 'center' });
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Total Questions', margin + cardWidth / 2, yPosition + 20, { align: 'center' });
  
  // Correct Answers Card
  pdf.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.roundedRect(margin + cardWidth + 5, yPosition, cardWidth, cardHeight, 2, 2, 'F');
  pdf.setFontSize(24);
  pdf.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text(correct.toString(), margin + cardWidth + 5 + cardWidth / 2, yPosition + 12, { align: 'center' });
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Correct Answers', margin + cardWidth + 5 + cardWidth / 2, yPosition + 20, { align: 'center' });
  
  // Score Percentage Card
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const scoreColor = percentage >= 70 ? colors.success : percentage >= 50 ? colors.warning : colors.danger;
  pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  pdf.roundedRect(margin + (cardWidth + 5) * 2, yPosition, cardWidth, cardHeight, 2, 2, 'F');
  pdf.setFontSize(24);
  pdf.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${percentage}%`, margin + (cardWidth + 5) * 2 + cardWidth / 2, yPosition + 12, { align: 'center' });
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Score', margin + (cardWidth + 5) * 2 + cardWidth / 2, yPosition + 20, { align: 'center' });
  
  yPosition += 35;
  
  // ==================== QUESTIONS SECTION ====================
  checkPageBreak(20);
  
  // Section header
  pdf.setFontSize(14);
  pdf.setTextColor(colors.darkGray[0], colors.darkGray[1], colors.darkGray[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Questions & Answers', margin, yPosition);
  
  // Decorative line
  pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition + 2, margin + 60, yPosition + 2);
  
  yPosition += 12;
  
  // Questions and Answers
  document.questions.forEach((question, index) => {
    checkPageBreak(40);
    
    // Question card background
    pdf.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
    pdf.setDrawColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    pdf.setLineWidth(0.3);
    
    const questionStartY = yPosition;
    
    // Question number badge
    pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.circle(margin + 6, yPosition + 6, 5, 'F');
    pdf.setFontSize(10);
    pdf.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    pdf.setFont('helvetica', 'bold');
    pdf.text((index + 1).toString(), margin + 6, yPosition + 8, { align: 'center' });
    
    // Question type badge
    const typeText = question.type === 'mcq' ? 'MCQ' : 
                     question.type === 'essay' ? 'Essay' : 
                     question.type === 'structured_essay' ? 'Structured' : 'Short';
    pdf.setFontSize(8);
    pdf.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    pdf.setFont('helvetica', 'normal');
    const typeWidth = pdf.getTextWidth(typeText) + 6;
    pdf.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    pdf.roundedRect(pageWidth - margin - typeWidth, yPosition + 2, typeWidth, 5, 1, 1, 'F');
    pdf.text(typeText, pageWidth - margin - typeWidth / 2, yPosition + 5.5, { align: 'center' });
    
    yPosition += 15;
    
    // Question text
    pdf.setFontSize(11);
    pdf.setTextColor(colors.black[0], colors.black[1], colors.black[2]);
    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(question.question, margin + 15, yPosition, contentWidth - 20, 11, colors.black, 1.6);
    
    yPosition += 6;
    
    // Options (for MCQ)
    if (question.type === 'mcq' && question.options) {
      question.options.forEach((option, optionIndex) => {
        checkPageBreak(15);
        
        const optionLetter = String.fromCharCode(65 + optionIndex);
        const isCorrect = question.correctAnswer.startsWith(optionLetter);
        
        // Option background
        if (isCorrect) {
          pdf.setFillColor(colors.success[0] + 40, colors.success[1] + 40, colors.success[2] + 40);
          pdf.roundedRect(margin + 15, yPosition - 4, contentWidth - 20, 8, 1, 1, 'F');
        }
        
        // Option letter circle
        pdf.setFillColor(isCorrect ? colors.success[0] : colors.lightGray[0], 
                         isCorrect ? colors.success[1] : colors.lightGray[1], 
                         isCorrect ? colors.success[2] : colors.lightGray[2]);
        pdf.circle(margin + 20, yPosition, 3, 'F');
        
        pdf.setFontSize(9);
        pdf.setTextColor(isCorrect ? colors.white[0] : colors.darkGray[0],
                         isCorrect ? colors.white[1] : colors.darkGray[1],
                         isCorrect ? colors.white[2] : colors.darkGray[2]);
        pdf.setFont('helvetica', 'bold');
        pdf.text(optionLetter, margin + 20, yPosition + 1.5, { align: 'center' });
        
        // Option text
        pdf.setFontSize(10);
        pdf.setTextColor(colors.black[0], colors.black[1], colors.black[2]);
        pdf.setFont('helvetica', 'normal');
        yPosition = addWrappedText(option, margin + 27, yPosition, contentWidth - 37, 10, colors.black, 1.4);
        
        yPosition += 2;
      });
      
      yPosition += 4;
    } else {
      // For non-MCQ questions, show correct answer in a box
      checkPageBreak(20);
      
      pdf.setFillColor(colors.success[0] + 40, colors.success[1] + 40, colors.success[2] + 40);
      pdf.roundedRect(margin + 15, yPosition, contentWidth - 20, 8, 2, 2, 'F');
      
      pdf.setFontSize(9);
      pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text('✓ Correct Answer:', margin + 20, yPosition + 3);
      
      yPosition += 8;
      
      pdf.setFontSize(10);
      pdf.setTextColor(colors.black[0], colors.black[1], colors.black[2]);
      pdf.setFont('helvetica', 'normal');
      yPosition = addWrappedText(question.correctAnswer, margin + 20, yPosition, contentWidth - 30, 10, colors.black, 1.5);
      
      yPosition += 6;
    }
    
    // Draw question card border
    const questionHeight = yPosition - questionStartY;
    pdf.setDrawColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin, questionStartY, contentWidth, questionHeight, 2, 2, 'S');
    
    yPosition += 8;
  });
  
  // Add footer to last page
  addPageFooter();
  
  // Download the PDF
  const fileName = `Quizzly_${document.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

export default generateQuizPDF;
