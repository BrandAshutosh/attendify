const ExcelJS = require('exceljs');

const generateExcelBuffer = async (data, sheetName = 'DeletedData') => {
    if (!data || data.length === 0) {
        throw new Error("No Data Provided To Generate Excel");
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    const headers = Object.keys(data[0]);

    worksheet.columns = headers.map(header => ({
        header: header.charAt(0).toUpperCase() + header.slice(1),
        key: header,
        width: 20
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF00' }
    };

    data.forEach(record => {
        worksheet.addRow(record);
    });

    return await workbook.xlsx.writeBuffer();
};

module.exports = { generateExcelBuffer };