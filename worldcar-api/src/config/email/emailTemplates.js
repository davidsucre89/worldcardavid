function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

export function createWelcomeEmailTemplate(username, activationLink) {
  const safeUsername = escapeHtml(username);
  const safeActivationLink = activationLink
    ? escapeHtml(activationLink)
    : null;
  const activationHtml = safeActivationLink
    ? `<p style="margin:24px 0;text-align:center">
        <a href="${safeActivationLink}" style="background:#2563eb;border-radius:6px;color:#ffffff;display:inline-block;font-weight:600;padding:14px 24px;text-decoration:none">
          Activar mi cuenta
        </a>
      </p>
      <p>Este enlace vence en 24 horas. Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
      <p style="overflow-wrap:anywhere"><a href="${safeActivationLink}" style="color:#2563eb">${safeActivationLink}</a></p>`
    : "";
  const activationText = activationLink
    ? `\n\nPara activar tu cuenta, abre este enlace: ${activationLink}\nEste enlace vence en 24 horas.`
    : "";

  return {
    subject: "¡Bienvenido a Worldcar!",
    text: `Hola ${username},\n\n¡Te damos la bienvenida a Worldcar! Tu cuenta se registró correctamente.${activationText}\n\nSi no solicitaste esta cuenta, puedes ignorar este mensaje.`,
    html: `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>¡Bienvenido a Worldcar!</title>
  </head>
  <body style="background:#f3f4f6;color:#1f2937;font-family:Arial,Helvetica,sans-serif;margin:0;padding:24px">
    <table role="presentation" style="border-collapse:collapse;margin:0 auto;max-width:600px;width:100%">
      <tr>
        <td style="background:#ffffff;border-radius:10px;padding:36px">
          <h1 style="color:#111827;font-size:26px;margin:0 0 24px">¡Bienvenido a Worldcar!</h1>
          <p>Hola ${safeUsername},</p>
          <p>Tu cuenta se registró correctamente. Nos alegra darte la bienvenida.</p>
          ${activationHtml}
          <p style="color:#6b7280;font-size:14px">Si no solicitaste esta cuenta, puedes ignorar este mensaje.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}
