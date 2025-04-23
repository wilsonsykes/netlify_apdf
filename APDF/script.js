window.onload = function () {
  // Extract the 'pdf' parameter from the URL (used to locate the PDF file)
  const urlParams = new URLSearchParams(window.location.search);
  const pdfPath = urlParams.get('pdf');

  if (pdfPath) {
    // Show the PDF inside an iframe using Google Docs Viewer
    const iframe = document.getElementById('pdf-frame');
    iframe.src = `https://raw.githubusercontent.com/wilsonsykes/netlify_apdf/main${pdfPath}`;
    iframe.style.display = 'block';
  } else {
    // If no PDF was provided, display an error
    document.getElementById('error-message').textContent = 'Invalid PDF link.';
    return;
  }

  // ==== Signature Pad Setup (Canvas) ====
  const canvas = document.getElementById('signature-pad');
  const ctx = canvas.getContext('2d');
  let drawing = false;

  // Helper function to get position from either mouse or touch event
  function getPos(e) {
    if (e.touches && e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.offsetX,
        y: e.offsetY
      };
    }
  }

  // Mouse Events for drawing
  canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (drawing) {
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  });

  canvas.addEventListener('mouseup', () => drawing = false);
  canvas.addEventListener('mouseleave', () => drawing = false);

  // Touch Events for drawing on mobile
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (drawing) {
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  });

  canvas.addEventListener('touchend', () => drawing = false);

  // Clear signature button
  document.getElementById('clear-btn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // ==== Sign & Upload Logic ====
  document.getElementById('sign-upload-btn').addEventListener('click', async () => {
    const recipientId = pdfPath.split('/')[1]; // Extract the PSID from the PDF path
    const originalPdfUrl = `https://apdf2025.netlify.app${pdfPath}`; // Full URL to the original PDF

    try {
      // Get PDF-lib classes from the global window object
      const PDFDocument = window.PDFLib.PDFDocument;
      const rgb = window.PDFLib.rgb;

      if (!PDFDocument) throw new Error("PDF-lib not loaded.");

      // Fetch original PDF as binary
      const pdfBytes = await fetch(originalPdfUrl).then(res => res.arrayBuffer());

      // Convert canvas signature to a PNG image blob
      canvas.toBlob(async (signatureBlob) => {
        const signatureImageBytes = await signatureBlob.arrayBuffer();

        // Load original PDF
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Embed PNG signature into the PDF
        const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
        const signatureDims = signatureImage.scale(0.5); // Scale down for better fit

        // Draw the signature on the first page
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        firstPage.drawImage(signatureImage, {
          x: 50, // X coordinate on page
          y: 50, // Y coordinate on page
          width: signatureDims.width,
          height: signatureDims.height
        });

        // Save the modified PDF
        const signedPdfBytes = await pdfDoc.save();

        // Prepare POST request with signed PDF and recipient_id
        const formData = new FormData();
        formData.append('recipient_id', recipientId);
        formData.append('signed_pdf', new Blob([signedPdfBytes], { type: 'application/pdf' }), `${recipientId}_signed.pdf`);

        // Send to your n8n webhook
        const response = await fetch('https://n8n.apdi2025.site/webhook-test/signed-upload', {
          method: 'POST',
          body: formData
        });

        // Handle response
        const result = await response.json();
        alert("Signature submitted successfully!");
        console.log(result);

      }, 'image/png'); // canvas.toBlob format

    } catch (err) {
      // Any error will show a failure alert
      console.error("Upload failed:", err);
      alert("Upload failed.");
    }
  });
};
