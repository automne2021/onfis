export interface FormField {
  id: string; 
  label: string;      
  type: string;      
  placeholder: string;
  rows?: number;      
}

export interface ContactFormData {
  [key: string]: string | File; 
}