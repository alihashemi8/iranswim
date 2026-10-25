/**
 * Utility to export JavaScript objects to UTF-8 CSV with BOM for Excel compatibility in Persian
 */
export const exportToCsv = (filename, rows, headers) => {
  if (!rows || !rows.length) return;

  const headerKeys = Object.keys(headers);
  const headerLabels = Object.values(headers);

  const csvRows = [];
  // Add header row
  csvRows.push(headerLabels.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  // Add data rows
  for (const row of rows) {
    const values = headerKeys.map((key) => {
      let val = row[key];
      if (val === undefined || val === null) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
