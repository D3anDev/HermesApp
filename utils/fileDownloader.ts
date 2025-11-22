/**
 * Initiates a file download in the browser.
 * @param filename The name of the file to download.
 * @param content The content of the file as a string or Blob.
 * @param mimeType The MIME type of the file (e.g., 'text/xml', 'application/json').
 */
export const downloadFile = (filename: string, content: string | Blob, mimeType: string): void => {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
