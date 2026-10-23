const fs = require('fs');
const path = require('path');

function createSimplePdf(lines) {
  let content = "BT\n/F1 12 Tf\n50 750 Td\n16 TL\n";
  for (const line of lines) {
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    content += `(${escaped}) '\n`;
  }
  content += "ET\n";

  const streamLength = Buffer.byteLength(content, 'utf-8');

  let pdf = "%PDF-1.4\n";
  const offsets = [];

  function addObj(str) {
    offsets.push(Buffer.byteLength(pdf, 'binary'));
    pdf += str;
  }

  addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  addObj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  addObj("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n");
  addObj("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
  addObj(`5 0 obj\n<< /Length ${streamLength} >>\nstream\n${content}endstream\nendobj\n`);

  const xrefOffset = Buffer.byteLength(pdf, 'binary');
  pdf += "xref\n0 6\n0000000000 65535 f \n";
  for (const off of offsets) {
    pdf += String(off).padStart(10, '0') + " 00000 n \n";
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'binary');
}

const lines = [
  "CAIXA ECONOMICA FEDERAL",
  "FATURA DE CARTAO DE CREDITO",
  "Nome do Titular: Eliton Nunes",
  "Cartao: 4092 **** **** 1024",
  "Data de Vencimento: 20/10/2026",
  "Periodo da Fatura: 21/09/2026 a 20/10/2026",
  "Total da Fatura: R$ 600,00",
  "Pagamento Minimo: R$ 90,00",
  "Limite Total de Credito: R$ 3.000,00",
  "Limite Disponivel: R$ 2.400,00",
  "Limite Utilizado: R$ 600,00",
  "DEMONSTRATIVO DE LANCAMENTOS:",
  "10/10/2026 Eliton nunes R$ 600,00"
];

const targetPath = path.join(__dirname, '..', 'app', 'faturas', 'Fatura_Caixa_Outubro_2026.pdf');
fs.writeFileSync(targetPath, createSimplePdf(lines));
console.log("Created Caixa PDF at:", targetPath);
