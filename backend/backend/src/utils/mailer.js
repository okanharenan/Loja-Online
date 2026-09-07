
export async function sendPasswordResetEmail(to, resetLink) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[email não configurado] Link de redefinição de senha para ${to}: ${resetLink}`
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Digital Store <onboarding@resend.dev>",
      to,
      subject: "Redefinição de senha — Digital Store",
      html: `
        <p>Recebemos um pedido para redefinir sua senha.</p>
        <p><a href="${resetLink}">Clique aqui para criar uma nova senha</a></p>
        <p>Esse link expira em 1 hora. Se você não pediu isso, pode ignorar este e-mail.</p>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("Falha ao enviar e-mail de redefinição de senha:", body);
  
  }
}