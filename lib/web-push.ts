import webpush from 'web-push';

if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys are not set. Push notifications will not work.');
}

const vapidEmail = process.env.VAPID_EMAIL || 'admin@1picday.xyz';
const subject = vapidEmail.includes(':') ? vapidEmail : `mailto:${vapidEmail}`;

webpush.setVapidDetails(
    subject,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

export default webpush;
