import * as Contacts from 'expo-contacts';
import { ScannedContact } from '@/types';

export type SaveContactResult =
  | { status: 'saved'; contactId: string }
  | { status: 'denied' }
  | { status: 'cancelled' }
  | { status: 'error' };

export interface ContactsService {
  saveContact(contact: ScannedContact): Promise<SaveContactResult>;
}

function splitName(fullName: string): { givenName: string; familyName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { givenName: parts[0], familyName: '' };
  return { givenName: parts[0], familyName: parts.slice(1).join(' ') };
}

export class ExpoContactsService implements ContactsService {
  async saveContact(contact: ScannedContact): Promise<SaveContactResult> {
    try {
      const permission = await Contacts.requestPermissionsAsync();
      if (!permission.granted) {
        return { status: 'denied' };
      }

      const { givenName, familyName } = splitName(contact.name);
      const phones = [
        { label: 'mobile', number: contact.phone },
        ...(contact.whatsapp && contact.whatsapp !== contact.phone
          ? [{ label: 'work', number: contact.whatsapp }]
          : []),
      ];

      const created = await Contacts.Contact.create({
        givenName,
        familyName,
        phones,
        ...(contact.title ? { jobTitle: contact.title } : {}),
        ...(contact.company ? { company: contact.company } : {}),
        ...(contact.email ? { emails: [{ label: 'work', address: contact.email }] } : {}),
      });

      return { status: 'saved', contactId: created.id };
    } catch (error) {
      if (error instanceof Error && error.name === 'CANCELED') {
        return { status: 'cancelled' };
      }
      return { status: 'error' };
    }
  }
}

export const contactsService: ContactsService = new ExpoContactsService();
