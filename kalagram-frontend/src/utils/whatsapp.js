import { formatDate } from './format.js';

export const DEFAULT_WHATSAPP = '919011059088';

export const FLOATING_MESSAGE =
  'Hello Kalagram! I am interested in learning about your mud house building workshops. Please share the upcoming workshop details.';

export function whatsappLink(number, text) {
  const digits = String(number || DEFAULT_WHATSAPP).replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function registrationMessage(r) {
  return [
    'New Workshop Registration – Kalagram',
    '',
    `Registration ID: ${r.registrationId}`,
    `Name: ${r.fullName}`,
    `Phone: ${r.mobile}`,
    `Email: ${r.email}`,
    `Workshop: ${r.workshopTitle}`,
    `Preferred Date: ${formatDate(r.startDate)}`,
    `Participants: ${r.participants}`,
    `City: ${r.city || '-'}`,
    `Message: ${r.message || '-'}`,
  ].join('\n');
}

export function enquiryMessage(e) {
  return [
    'New Enquiry – Kalagram',
    '',
    `Name: ${e.name}`,
    `Phone: ${e.phone}`,
    `Email: ${e.email}`,
    `Enquiry For: ${e.enquiryFor}`,
    `Message: ${e.message}`,
  ].join('\n');
}
