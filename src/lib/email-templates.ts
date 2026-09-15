const brandHeader = `
  <div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 480px; margin: 0 auto;">
    <p style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; margin-bottom: 24px;">
      Reymen <span style="color: #1a3ef5;">Solutions</span>
    </p>
`;
const brandFooter = `
    <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">
      Si no esperabas este correo, puedes ignorarlo con seguridad.
    </p>
  </div>
`;

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#1a3ef5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a>`;
}

export function passwordResetEmail(resetUrl: string, expiresInMinutes: number) {
  return {
    subject: "Restablece tu contraseña — Reymen AI Ops",
    html: `${brandHeader}
      <h1 style="font-size:20px;color:#0f172a;">Restablece tu contraseña</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;">
        Recibimos una solicitud para restablecer tu contraseña. Este enlace es válido por ${expiresInMinutes} minutos.
      </p>
      <p style="margin: 24px 0;">${button(resetUrl, "Restablecer contraseña")}</p>
      <p style="font-size:12px;color:#94a3b8;word-break:break-all;">${resetUrl}</p>
      ${brandFooter}`,
    text: `Restablece tu contraseña visitando: ${resetUrl} (válido por ${expiresInMinutes} minutos)`,
  };
}

export function teamInviteEmail(orgName: string, loginUrl: string) {
  return {
    subject: `Te agregaron al equipo de ${orgName} en Reymen`,
    html: `${brandHeader}
      <h1 style="font-size:20px;color:#0f172a;">Bienvenido a ${orgName}</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;">
        Un administrador te agregó al equipo en Reymen AI Ops. Usa tu email y la contraseña temporal que te compartieron para iniciar sesión.
      </p>
      <p style="margin: 24px 0;">${button(loginUrl, "Iniciar sesión")}</p>
      ${brandFooter}`,
    text: `Te agregaron al equipo de ${orgName} en Reymen AI Ops. Inicia sesión en: ${loginUrl}`,
  };
}

export function escalationAlertEmail(orgName: string, contactName: string, portalUrl: string) {
  return {
    subject: `⚠️ Conversación escalada — ${orgName}`,
    html: `${brandHeader}
      <h1 style="font-size:20px;color:#0f172a;">Conversación escalada a humano</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;">
        ${contactName} necesita atención de tu equipo en <strong>${orgName}</strong>.
      </p>
      <p style="margin: 24px 0;">${button(portalUrl, "Ver conversación")}</p>
      ${brandFooter}`,
    text: `${contactName} necesita atención en ${orgName}. Ver: ${portalUrl}`,
  };
}

export function automationFailureEmail(orgName: string, automationName: string, portalUrl: string) {
  return {
    subject: `🔴 Automatización con errores — ${automationName}`,
    html: `${brandHeader}
      <h1 style="font-size:20px;color:#0f172a;">Automatización con errores</h1>
      <p style="font-size:14px;color:#475569;line-height:1.6;">
        La automatización <strong>${automationName}</strong> de <strong>${orgName}</strong> reportó una falla y requiere revisión.
      </p>
      <p style="margin: 24px 0;">${button(portalUrl, "Ver automatización")}</p>
      ${brandFooter}`,
    text: `${automationName} (${orgName}) reportó una falla. Ver: ${portalUrl}`,
  };
}
