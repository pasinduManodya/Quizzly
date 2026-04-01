import jsPDF from 'jspdf';

// Helper function to convert SVG to PNG data URL
const svgToPng = (svgUrl: string, width: number, height: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load SVG'));
    img.src = svgUrl;
  });
};

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
  
  // Load and convert logo
  let logoDataUrl: string | null = null;
  try {
    // Use actual SVG dimensions for proper aspect ratio
    logoDataUrl = await svgToPng('/Logo_Final.svg', 2946.64, 766.24);
  } catch (error) {
    console.error('Failed to load logo for PDF:', error);
  }
  
  // Helper function to add creative first page header
  const addFirstPageHeader = () => {
    if (logoDataUrl) {
      // Add logo image centered (maintaining aspect ratio: 2946.64:766.24 ≈ 3.85:1)
      const logoHeight = 12;
      const logoWidth = logoHeight * (2946.64 / 766.24); // Maintain exact SVG aspect ratio
      const logoX = (pageWidth - logoWidth) / 2;
      pdf.addImage(logoDataUrl, 'PNG', logoX, 10, logoWidth, logoHeight);
    } else {
      // Fallback to text
      pdf.setFontSize(18);
      pdf.setFont('times', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('QUIZZLY', pageWidth / 2, 18, { align: 'center' });
    }
    
    // Website below logo (with vertical padding)
    pdf.setFontSize(10);
    pdf.setFont('times', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Quizzlyedu.com', pageWidth / 2, 26, { align: 'center' });
    
    // Horizontal line separator (with padding)
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.line(margin, 32, pageWidth - margin, 32);
  };
  
  // Helper function to add standard page header
  const addPageHeader = () => {
    if (logoDataUrl) {
      // Add small logo on left (maintaining aspect ratio: 2946.64:766.24)
      const logoHeight = 8;
      const logoWidth = logoHeight * (2946.64 / 766.24); // Maintain exact SVG aspect ratio
      pdf.addImage(logoDataUrl, 'PNG', margin, 8, logoWidth, logoHeight);
    } else {
      // Fallback to text
      pdf.setFontSize(11);
      pdf.setFont('times', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('QUIZZLY', margin, 12);
    }
    
    // Website on right
    pdf.setFontSize(9);
    pdf.setFont('times', 'normal');
    pdf.setTextColor(60, 60, 60);
    pdf.text('Quizzlyedu.com', pageWidth - margin, 12, { align: 'right' });
    
    // Horizontal line (with spacing)
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.line(margin, 19, pageWidth - margin, 19);
  };
  
  // Helper function to add footer with branding
  const addPageFooter = () => {
    const footerY = pageHeight - 10;
    
    // Horizontal line above footer
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    if (logoDataUrl) {
      // Add small logo (maintaining aspect ratio: 2946.64:766.24)
      const logoHeight = 5;
      const logoWidth = logoHeight * (2946.64 / 766.24); // Maintain exact SVG aspect ratio
      pdf.addImage(logoDataUrl, 'PNG', margin, footerY - 3.5, logoWidth, logoHeight);
      
      // Website next to logo
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      pdf.setFont('times', 'normal');
      pdf.text('- Quizzlyedu.com', margin + logoWidth + 2, footerY);
    } else{
      // Fallback to text
      pdf.setFontSize(8);
      pdf.setTextColor(80, 80, 80);
      pdf.setFont('times', 'bold');
      pdf.text('QUIZZLY', margin, footerY);
      
      pdf.setFont('times', 'normal');
      pdf.text('- Quizzlyedu.com', margin + 15, footerY);
    }
    
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
      yPosition = 30; // Increased to account for header spacing
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
  
  // ==================== FIRST PAGE WITH CREATIVE HEADER ====================
  addFirstPageHeader();
  yPosition = 39;
  
  // Title section
  pdf.setFontSize(16);
  pdf.setFont('times', 'bold');
  pdf.setTextColor(0, 0, 0);
  
  // Center the title
  const titleLines = pdf.splitTextToSize(document.title, contentWidth);
  titleLines.forEach((line: string, index: number) => {
    pdf.text(line, pageWidth / 2, yPosition + (index * 6), { align: 'center' });
  });
  
  yPosition += titleLines.length * 6 + 6;
  
  // Add a horizontal line under title
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  
  yPosition += 8;
  
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
