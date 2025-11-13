const XLSX = require('xlsx');

exports.parseExcelFile = (filePath) => {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        return XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
        throw new Error('Error parsing Excel file');
    }
};