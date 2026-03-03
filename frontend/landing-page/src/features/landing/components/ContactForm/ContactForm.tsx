import type { ContactFormData, FormField } from "./type";

interface ContactFormProps {
  contactData: FormField[];
  onSubmitData: (data: ContactFormData) => void;
}

export default function ContactForm({ contactData, onSubmitData }: ContactFormProps) {
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onSubmitData(data);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {contactData.map((field) => (
        <div key={field.id} className="flex flex-col gap-3 mt-4">
          <label htmlFor={field.id} className="body-2-medium">
            {field.label}
          </label>
          
          {field.type === 'textarea' ? (
            <textarea
              id={field.id}   
              name={field.id} 
              placeholder={field.placeholder}
              rows={field.rows || 4}
              required 
              className="body-2-regular px-3 py-2 border-2 border-neutral-300 rounded-[8px] outline-none transition resize-none focus:border-primary [&:not(:placeholder-shown)]:border-primary"
            />
          ) : (
            <input
              id={field.id}   
              name={field.id} 
              placeholder={field.placeholder}
              required
              className="body-2-regular px-3 py-2 border-2 border-neutral-300 rounded-[8px] outline-none transition focus:border-primary [&:not(:placeholder-shown)]:border-primary"
            />
          )}
        </div>
      ))}

      <button 
        type="submit" 
        className="mt-6 w-full body-2-regular bg-primary text-white py-3 rounded-[8px] hover:bg-primary-hover transition cursor-pointer"
      >
        Send Message
      </button>
    </form>
  );
}