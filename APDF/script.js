window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const pdfPath = urlParams.get('pdf');

  if (pdfPath) {
    const iframe = document.getElementById('pdf-frame');
    iframe.src = `https://docs.google.com/gview?url=https://apdf2025.netlify.app${pdfPath}&embedded=true`;
    iframe.style.display = 'block';
  } else {
    document.getElementById('error-message').textContent = 'Invalid PDF link.';
  }
};
