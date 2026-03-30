export class CreateAgencyDto {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  plan?: string;
}