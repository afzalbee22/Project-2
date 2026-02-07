import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';

export const extractText = async (filePath, fileType) => {
  try {
    if (fileType === 'application/pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (fileType.startsWith('text/')) {
      return await fs.readFile(filePath, 'utf-8');
    }
    return '';
  } catch (error) {
    console.error('File parsing error:', error);
    return '';
  }
};
