const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');

// Définir les polices standard PDF pour éviter les problèmes de fichiers locaux
const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);

/**
 * Génère un document PDF à partir de données sous forme de tableau
 * @param {Object} options Options de génération
 * @param {string} options.title Titre du document
 * @param {Object} options.metadata Dictionnaire des métadonnées (ex: { 'EPA': 'Mon EPA', 'Année': 2026 })
 * @param {Array<string>} options.headers En-têtes du tableau
 * @param {Array<Array<any>>} options.rows Lignes de données
 * @returns {Promise<Buffer>} Le PDF généré sous forme de buffer
 */
const generatePDF = (options) => {
  return new Promise((resolve, reject) => {
    try {
      const { title, metadata, headers, rows } = options;

      // Construction des métadonnées
      const metadataStack = Object.entries(metadata || {}).map(([key, value]) => ({
        text: `${key}: ${value}`,
        margin: [0, 2, 0, 2]
      }));

      // Construction du tableau
      const tableBody = [];
      
      // En-têtes
      if (headers && headers.length > 0) {
        tableBody.push(headers.map(h => ({ text: h, style: 'tableHeader' })));
      }

      // Lignes
      if (rows && rows.length > 0) {
        rows.forEach(row => {
          tableBody.push(row.map(cell => ({ text: cell !== null && cell !== undefined ? cell.toString() : '' })));
        });
      } else if (headers) {
        // Ligne vide si pas de données
        tableBody.push(headers.map(() => ({ text: '-' })));
      }

      const docDefinition = {
        defaultStyle: {
          font: 'Helvetica'
        },
        content: [
          { text: title, style: 'header' },
          { stack: metadataStack, margin: [0, 10, 0, 20] },
          {
            table: {
              headerRows: 1,
              widths: headers ? headers.map(() => '*') : [],
              body: tableBody
            },
            layout: 'lightHorizontalLines'
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 10],
            alignment: 'center'
          },
          tableHeader: {
            bold: true,
            fontSize: 12,
            color: 'black',
            fillColor: '#f3f3f3'
          }
        }
      };

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks = [];

      pdfDoc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      pdfDoc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });

      pdfDoc.on('error', (err) => {
        reject(err);
      });

      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Génère un fichier Excel (.xlsx) à partir de données sous forme de tableau
 * @param {Object} options Options de génération
 * @param {string} options.title Titre de la feuille
 * @param {Array<Object>} options.columns Définition des colonnes (ex: [{ header: 'Id', key: 'id', width: 10 }])
 * @param {Array<Object>} options.rows Données (tableau d'objets)
 * @returns {Promise<Buffer>} L'Excel généré sous forme de buffer
 */
const generateExcel = async (options) => {
  try {
    const { title, columns, rows } = options;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Système EPA Budget';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(title || 'Données');

    if (columns) {
      worksheet.columns = columns;
      
      // Style de l'en-tête
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F3F3' }
      };
    }

    if (rows && rows.length > 0) {
      worksheet.addRows(rows);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generatePDF,
  generateExcel
};
