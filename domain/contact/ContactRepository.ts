import type { Contact, CreateContactInput } from './Contact'

export interface ContactRepository {
  findByAccountId(accountId: string): Promise<Contact[]>
  findById(id: string): Promise<Contact | null>
  create(input: CreateContactInput): Promise<Contact>
  update(id: string, input: Partial<CreateContactInput>): Promise<Contact>
  delete(id: string): Promise<void>
}
