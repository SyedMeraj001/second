// Test that jsPDF can be imported correctly
import jsPDF from 'jspdf';

export default function testPDFImport() {
  try {
    const pdf = new jsPDF();
    return "jsPDF import successful";
  } catch (error) {
    return `Error: ${error.message}`;
  }
}
