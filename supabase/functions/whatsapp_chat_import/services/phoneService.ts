
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}
