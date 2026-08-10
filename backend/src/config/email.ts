import { logger } from '../middlewares/logger.middleware';

const DEFAULT_ZEABUR_EMAIL_API_URL = 'https://api.zeabur.com/api/v1/zsend';

const isPlaceholder = (value?: string): boolean =>
  !value || /your_|change[_-]?me|example\.com|x{6,}/i.test(value);

export const isEmailConfigured = (): boolean =>
  process.env.EMAIL_ENABLED !== 'false' &&
  !isPlaceholder(process.env.ZEABUR_EMAIL_API_KEY) &&
  !isPlaceholder(process.env.ZEABUR_EMAIL_FROM);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface ZeaburEmailResponse {
  id?: string;
  email_id?: string;
  status?: string;
  message?: string;
  error?: string;
}

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as ZeaburEmailResponse;
    return body.error || body.message || `Zeabur Email returned HTTP ${response.status}`;
  } catch {
    return `Zeabur Email returned HTTP ${response.status}`;
  }
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!isEmailConfigured()) {
    logger.warn(`Email skipped because Zeabur Email is not configured (recipient: ${options.to})`);
    return;
  }

  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  const apiBaseUrl = (process.env.ZEABUR_EMAIL_API_URL || DEFAULT_ZEABUR_EMAIL_API_URL).replace(/\/$/, '');
  const payload = {
    from: process.env.ZEABUR_EMAIL_FROM,
    to: recipients,
    subject: options.subject,
    html: options.html,
    ...(options.text && { text: options.text }),
  };

  let lastError = 'Unknown Zeabur Email error';

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${apiBaseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.ZEABUR_EMAIL_API_KEY}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const result = (await response.json()) as ZeaburEmailResponse;
        logger.info(
          `📧 Email queued by Zeabur: ${result.id || result.email_id || 'unknown'} to ${recipients.join(', ')}`
        );
        return;
      }

      lastError = await getErrorMessage(response);
      const shouldRetry = response.status === 429 || response.status >= 500;
      if (!shouldRetry || attempt === 2) break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Zeabur Email request failed';
      if (attempt === 2) break;
    }

    await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
  }

  logger.error(`Failed to send email through Zeabur: ${lastError}`);
  throw new Error('Failed to send email');
};
